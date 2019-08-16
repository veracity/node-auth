"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interfaces_1 = require("../interfaces");
const utils_1 = require("../utils");
const uriParams_1 = require("../utils/uriParams");
const B2CError_1 = require("./B2CError");
const getMetadata = (() => {
    let metadataStore = {};
    const invalidateMetadata = () => {
        if (!metadataStore.metadata)
            return;
        if (!metadataStore.keepUntil)
            return;
        if (Date.now() > metadataStore.keepUntil) {
            metadataStore = {};
        }
    };
    return async (parameters) => {
        invalidateMetadata();
        if (metadataStore.metadata) {
            return metadataStore.metadata;
        }
        const metadata = await utils_1.getVeracityAuthMetadata(parameters);
        if (parameters.configuration && parameters.configuration.keepMetadataFor) {
            metadataStore = {
                metadata,
                keepUntil: Date.now() + (parameters.configuration.keepMetadataFor * 1000)
            };
        }
        return metadata;
    };
})();
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
     * Returns the last resolved id token.
     */
    get idToken() {
        if (!this.session.data || !this.session.data.lastIdTokenDecoded) {
            return undefined;
        }
        return this.session.data.lastIdTokenDecoded.payload;
    }
    /**
     * Returns an object keyed by api scope that contains all ready access tokens and related information.
     */
    get readyTokens() {
        return this.session.data.tokens || {};
    }
    /**
     * Returns the next api scope that should be logged in or undefined if all scopes are logged in.
     */
    get nextAPIScope() {
        const readyApiScopes = Object.keys(this.readyTokens);
        return (this.strategySettings.apiScopes || []).find((scopeToProcess) => {
            return readyApiScopes.indexOf(scopeToProcess) < 0;
        });
    }
    /**
     * Checks whether we still have some more api scopes that have not negotiated for their tokens.
     */
    get hasMoreAPIScopes() {
        return !!this.nextAPIScope;
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
    get isB2CLoginResponse() {
        if (this.req.method !== "POST")
            return false;
        if (typeof this.req.body !== "object")
            return false;
        return interfaces_1.isB2CLoginResponse(this.req.body);
    }
    /**
     * Determines if the current request is a failure response from B2C of any kind.
     */
    get isB2CFailureResponse() {
        if (this.req.method !== "POST")
            return false;
        if (!this.req.body)
            return false;
        return interfaces_1.isB2CResponseFailure(this.req.body);
    }
    get reqBodyLoginResponse() {
        return this.req.body;
    }
    get reqBodyAccessCodeResponse() {
        return this.req.body;
    }
    get reqBodyFailureResponse() {
        return this.req.body;
    }
    /**
     * Returns metadata from session if possible or from endpoint
     */
    async getClosestMetadata() {
        if (this.session.data.metadata) {
            return this.session.data.metadata;
        }
        const metadata = await getMetadata(this.strategySettings);
        return metadata; // Direct return await does not always compile to code that throws errors correclty.
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
    /**
     * This is the magic method that causes the entire login process to proceeed correctly.
     * If called on the initial login request:
     *   Sets up session state
     *   Returns the full url to redirect the user to in order to log them in.
     *
     * If called on the users return from logging in:
     *   Validates the id token and authorization code
     *   Exchanges the authorization code for an access token and optional refresh token
     *   Validates the access token
     *   Stores data in session and tokens under proper api scope name
     *   If there are more api scopes logs in with new scope
     *   Else returns false to indicate the login flow is completed
     *
     * If any error occurs it will throw exceptions. Calling code should deal with them.¨
     * @returns url to redirect the user to in order to log them in or false if no more logins are required.
     */
    async next() {
        if (this.isB2CFailureResponse) {
            throw new B2CError_1.B2CError(this.reqBodyFailureResponse);
        }
        if (this.isB2CLoginResponse) {
            await this.verifyLoginResponseAndUpdateContext();
            return false;
        }
        return this.initializeLoginAndReturnLoginUrl();
    }
    /**
     * Clears any temporary session information used during authentication
     */
    cleanUp() {
        this.session.destroyNamespace();
    }
    regenerateNonce() {
        this._nonce = utils_1.createUid();
    }
    regenerateState() {
        this._state = utils_1.createUid();
    }
    /**
     * Initialize parameters and session and returns the the url to redirect the user to with all parameters
     */
    async initializeLoginAndReturnLoginUrl() {
        this.regenerateNonce();
        this.regenerateState();
        const metadata = await this.getClosestMetadata();
        const params = this.loginParams;
        this.session.data = {
            ...this.session.data,
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
     * Checks that the returned data is valid and correct and updates the session with this information for future use.
     */
    async verifyLoginResponseAndUpdateContext() {
        const { code, id_token, state } = this.reqBodyLoginResponse;
        if (state !== this.state) {
            throw new Error("State returned from B2C differs from state that was sent. Request may have been tampered with.");
        }
        const validationOptions = await this.getValidationOptions(id_token);
        const idTokenDecoded = utils_1.validateIDTokenAndAuthorizationCode(code, validationOptions);
        this.session.data = {
            ...this.session.data,
            lastIdToken: id_token,
            lastIdTokenDecoded: idTokenDecoded
        };
    }
}
exports.VeracityAuthFlowStrategyContext = VeracityAuthFlowStrategyContext;
