"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interfaces_1 = require("../interfaces");
const utils_1 = require("../utils");
const uriParams_1 = require("../utils/uriParams");
const VIDPError_1 = require("./errors/VIDPError");
/**
 * Helper class for managing the current authentication context.
 * Enables support for negotiating multiple tokens within a single login request.
 */
class VeracityAuthFlowStrategyContext {
    constructor(req, strategySettings) {
        this.req = req;
        this.strategySettings = strategySettings;
        this._nonce = utils_1.createUid();
        this._state = utils_1.createUid();
        this.session = new utils_1.SessionWrapper("authflow", req);
    }
    get nonce() {
        if (this.session.data && this.session.data.nonce) {
            return this.session.data.nonce;
        }
        return this._nonce;
    }
    get state() {
        if (this.session.data && this.session.data.state) {
            return this.session.data.state;
        }
        return this._state;
    }
    /**
     * Returns the last resolved id token string.
     */
    get idToken() {
        return this._idToken;
    }
    /**
     * Returns the last resolved id tokens decoded payload.
     */
    get idTokenDecoded() {
        return this._idTokenDecoded;
    }
    /**
     * Returns an object keyed by api scope that contains all ready access tokens and related information.
     */
    get readyTokens() {
        return this.session.data.tokens || this._tokenData;
    }
    /**
     * Returns the scope that is currently being authenticated or if this is called before authrization code
     * is returned it returns the next API scope.
     */
    get currentAPIScope() {
        return this.session.data && this.session.data.apiScope ? this.session.data.apiScope : this.nextAPIScope;
    }
    /**
     * Returns the next api scope that should be logged in or undefined if all scopes are logged in.
     */
    get nextAPIScope() {
        const readyApiScopes = Object.keys(this.readyTokens || {});
        return (this.strategySettings.apiScopes || []).find((scopeToProcess) => {
            return readyApiScopes.indexOf(scopeToProcess) < 0;
        });
    }
    /**
     * Returns all parameters needed to redirect the user to a B2C for login.
     * The parameters will remain the same for the lifetime of this instance.
     */
    get loginParams() {
        const scopes = ["openid"];
        if (this.strategySettings.requestRefreshTokens) {
            scopes.push("offline_access");
        }
        scopes.push(this.nextAPIScope || "");
        return {
            client_id: this.strategySettings.clientId,
            redirect_uri: this.strategySettings.redirectUri,
            response_type: "code id_token",
            response_mode: "form_post",
            scope: scopes.join(" "),
            state: this.state,
            nonce: this.nonce
        };
    }
    /**
     * Returns all parameters needed to perform an authorization code exchange for an access token.
     * The parameters will remain the same for the lifetime of this instance.
     */
    get accessTokenParams() {
        if (!this.isLoginResponse) {
            throw new Error("This request does not appear to be a login response from B2C. Cannot construct accessTokenParams");
        }
        const scopes = ["openid"];
        if (this.strategySettings.requestRefreshTokens) {
            scopes.push("offline_access");
        }
        scopes.push(this.nextAPIScope || "");
        return {
            client_id: this.strategySettings.clientId,
            client_secret: this.strategySettings.clientSecret,
            code: this.reqBodyLoginResponse.code,
            grant_type: "authorization_code",
            redirect_uri: this.strategySettings.redirectUri,
            scope: scopes.join(" ")
        };
    }
    /**
     * Determines if the current request is a user returning from a login at B2C or a federated service.
     */
    get isLoginResponse() {
        if (this.req.method !== "POST")
            return false;
        if (typeof this.req.body !== "object")
            return false;
        return interfaces_1.isVIDPLoginResponse(this.req.body);
    }
    /**
     * Determines if the current request is a failure response from B2C of any kind.
     */
    get isFailureResponse() {
        if (this.req.method !== "POST")
            return false;
        if (!this.req.body)
            return false;
        return interfaces_1.isVIDPResponseFailure(this.req.body);
    }
    get reqBodyLoginResponse() {
        return this.req.body;
    }
    get reqBodyFailureResponse() {
        return this.req.body;
    }
    /**
     * This is the magic method that causes the entire login process to proceeed correctly.
     * If called on the initial login request:
     *   Sets up session state,
     *   Returns the full url to redirect the user to in order to log them in.
     *
     * If called on the users return from logging in:
     *   Validates the id token and authorization code,
     *   Exchanges the authorization code for an access token and optional refresh token,
     *   Validates the access token,
     *   Stores data in session and tokens under proper api scope name,
     *   If there are more api scopes logs in with new scope,
     *   Else returns false to indicate the login flow is completed,
     *
     * If any error occurs it will throw exceptions. Calling code should deal with them.
     * @returns url to redirect the user to in order to log them in or false if no more logins are required.
     */
    async next() {
        try {
            if (this.isFailureResponse) {
                throw new VIDPError_1.VIDPError(this.reqBodyFailureResponse);
            }
            if (this.isLoginResponse) {
                const loginResult = await this.processLoginResponse();
                if (!loginResult) { // Means there are no more logins to perform
                    this.cleanUp();
                    return false;
                }
                return loginResult;
            }
            return this.beginLogin(); // Continue with next login
        }
        catch (error) {
            this.cleanUp();
            throw error;
        }
    }
    /**
     * Returns metadata from session if possible or from endpoint
     */
    async getClosestMetadata() {
        if (this.session.data.metadata) {
            return this.session.data.metadata;
        }
        const metadata = await utils_1.getCachedVeracityAuthMetadata(this.strategySettings);
        return metadata; // Direct return await does not always compile to code that throws errors correclty.
    }
    /**
     * Clears any temporary session information used during authentication
     */
    cleanUp() {
        this.session.destroyNamespace();
    }
    /**
     * Returns a complete validation options object that can be used for validating authorization codes
     * or access tokens.
     * @param idToken
     */
    async getValidationOptions(idToken) {
        const meta = await this.getClosestMetadata();
        return {
            clientId: this.strategySettings.clientId,
            issuer: meta.issuer,
            nonce: this.nonce,
            jwks: meta.jwks,
            idToken
        };
    }
    regenerateNonce() {
        this._nonce = utils_1.createUid();
    }
    regenerateState() {
        this._state = utils_1.createUid();
    }
    async validateLoginResponse() {
        const { code, id_token, state } = this.reqBodyLoginResponse;
        if (state !== this.state) {
            throw new Error("State returned from B2C differs from state that was sent. Request may have been tampered with.");
        }
        const validationOptions = await this.getValidationOptions(id_token);
        return utils_1.validateIDTokenAndAuthorizationCode(code, validationOptions);
    }
    async exchangeAuthCodeForAccessToken() {
        const metadata = await this.getClosestMetadata();
        const form = this.accessTokenParams;
        const accessTokenRawResponse = await utils_1.request(metadata.token_endpoint, {
            method: "POST",
            form
        });
        return JSON.parse(accessTokenRawResponse);
    }
    async validateAccessToken(idToken, accessToken) {
        const validationOptions = await this.getValidationOptions(idToken);
        return utils_1.validateIDTokenAndAccessToken(accessToken, validationOptions);
    }
    /**
     * Initializes state and sets up parameters for the first or any subsequent logins.
     */
    async beginLogin() {
        this.regenerateNonce();
        this.regenerateState();
        const metadata = await this.getClosestMetadata();
        const params = this.loginParams;
        this.session.data = {
            ...this.session.data,
            apiScope: this.nextAPIScope,
            state: params.state,
            nonce: params.nonce,
            metadata
        };
        const loginUrl = metadata.authorization_endpoint +
            (metadata.authorization_endpoint.indexOf("?") >= 0 ? "&" : "?") +
            uriParams_1.combineParams(uriParams_1.encodeURIParams(params)).join("&");
        return loginUrl;
    }
    /**
     * Validates the returned id token and authorization code.
     *
     * Exchanges authorization code for access token and optional refresh token.
     *
     * Validates access token and stores data in session.
     */
    async processLoginResponse() {
        const validLoginIDToken = await this.validateLoginResponse();
        if (!this.currentAPIScope) {
            this._idToken = this.reqBodyLoginResponse.id_token;
            this._idTokenDecoded = validLoginIDToken.payload;
            return false;
        }
        const accessTokenResponse = await this.exchangeAuthCodeForAccessToken();
        const { id_token, access_token } = accessTokenResponse;
        const validAccessToken = await this.validateAccessToken(id_token, access_token);
        const allTokenData = {
            ...accessTokenResponse,
            ...validAccessToken
        };
        this._idToken = validAccessToken.idToken;
        this._idTokenDecoded = validAccessToken.idTokenDecoded.payload;
        this._tokenData = {
            ...(this.session.data.tokens || {}),
            ...this.constructTokenData(this.currentAPIScope, allTokenData)
        };
        this.session.data = {
            ...this.session.data,
            tokens: this._tokenData
        };
        if (this.nextAPIScope) {
            return this.beginLogin();
        }
        return false;
    }
    constructTokenData(apiScope, data) {
        const tokenData = {
            idToken: data.idToken,
            idTokenDecoded: data.idTokenDecoded.payload,
            accessToken: data.accessToken,
            accessTokenDecoded: data.accessTokenDecoded.payload,
            accessTokenExpires: data.accessTokenDecoded.payload.exp,
            accessTokenLifetime: parseInt(data.expires_in, 10),
            scope: apiScope
        };
        if (data.refresh_token) {
            tokenData.refreshToken = data.refresh_token;
            tokenData.refreshTokenExpires = data.refresh_token_expires_in ?
                parseInt(data.refresh_token_expires_in, 10) : undefined;
        }
        return {
            [apiScope]: tokenData
        };
    }
}
exports.VeracityAuthFlowStrategyContext = VeracityAuthFlowStrategyContext;
