import { Request } from "express";
import { IVeracityAuthFlowStrategySettings, IVeracityAuthMetadataWithJWKs, IVeracityIDTokenPayload, IVeracityTokenData } from "../interfaces";
export interface IVeracityAuthFlowSessionData {
    metadata: IVeracityAuthMetadataWithJWKs;
    state: string;
    nonce: string;
    /**
     * The scope that is currently being authenticated.
     */
    apiScope?: string;
    /**
     * All access tokens that have been negotiated and validated.
     */
    tokens?: {
        [scope: string]: IVeracityTokenData;
    };
}
/**
 * Helper class for managing the current authentication context.
 * Enables support for negotiating multiple tokens within a single login request.
 */
export declare class VeracityAuthFlowStrategyContext {
    private req;
    private strategySettings;
    private readonly nonce;
    private readonly state;
    /**
     * Returns the last resolved id token string.
     */
    readonly idToken: string | undefined;
    /**
     * Returns the last resolved id tokens decoded payload.
     */
    readonly idTokenDecoded: IVeracityIDTokenPayload | undefined;
    /**
     * Returns an object keyed by api scope that contains all ready access tokens and related information.
     */
    readonly readyTokens: {
        [scope: string]: IVeracityTokenData;
    } | undefined;
    /**
     * Returns the scope that is currently being authenticated or if this is called before authrization code
     * is returned it returns the next API scope.
     */
    private readonly currentAPIScope;
    /**
     * Returns the next api scope that should be logged in or undefined if all scopes are logged in.
     */
    private readonly nextAPIScope;
    /**
     * Returns all parameters needed to redirect the user to a B2C for login.
     * The parameters will remain the same for the lifetime of this instance.
     */
    private readonly loginParams;
    /**
     * Returns all parameters needed to perform an authorization code exchange for an access token.
     * The parameters will remain the same for the lifetime of this instance.
     */
    private readonly accessTokenParams;
    /**
     * Determines if the current request is a user returning from a login at B2C or a federated service.
     */
    private readonly isLoginResponse;
    /**
     * Determines if the current request is a failure response from B2C of any kind.
     */
    private readonly isFailureResponse;
    private readonly reqBodyLoginResponse;
    private readonly reqBodyFailureResponse;
    private session;
    private _nonce;
    private _state;
    private _idToken?;
    private _idTokenDecoded?;
    private _tokenData?;
    constructor(req: Request, strategySettings: IVeracityAuthFlowStrategySettings);
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
    next(): Promise<string | false>;
    /**
     * Returns metadata from session if possible or from endpoint
     */
    private getClosestMetadata;
    /**
     * Clears any temporary session information used during authentication
     */
    private cleanUp;
    /**
     * Returns a complete validation options object that can be used for validating authorization codes
     * or access tokens.
     * @param idToken
     */
    private getValidationOptions;
    private regenerateNonce;
    private regenerateState;
    private validateLoginResponse;
    private exchangeAuthCodeForAccessToken;
    private validateAccessToken;
    /**
     * Initializes state and sets up parameters for the first or any subsequent logins.
     */
    private beginLogin;
    /**
     * Validates the returned id token and authorization code.
     *
     * Exchanges authorization code for access token and optional refresh token.
     *
     * Validates access token and stores data in session.
     */
    private processLoginResponse;
    private constructTokenData;
}
