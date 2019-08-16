import { Request } from "express";
import { IB2CAccessTokenRequestParameters, IB2CAuthorizationCodeExchangeResponseFailure, IB2CAuthorizationCodeExchangeResponseSuccess, IB2CLoginRequestParamaters, IB2CLoginResponseFailure, IB2CLoginResponseSuccess, IVeracityAuthFlowSessionData, IVeracityAuthFlowStrategySettings, IVeracityAuthMetadataWithJWKs } from "../interfaces";
import { IValidationOptions, SessionWrapper } from "../utils";
/**
 * Helper class for managing the current authentication context.
 * Enables support for negotiating multiple tokens within a single login request.
 */
export declare class VeracityAuthFlowStrategyContext {
    private req;
    private strategySettings;
    readonly nonce: string;
    readonly state: string;
    /**
     * Returns the last resolved id token.
     */
    readonly idToken: import("../interfaces").IVeracityIDTokenPayload | undefined;
    /**
     * Returns an object keyed by api scope that contains all ready access tokens and related information.
     */
    readonly readyTokens: {
        [scope: string]: import("../interfaces").IVeracityTokenData;
    };
    /**
     * Returns the next api scope that should be logged in or undefined if all scopes are logged in.
     */
    readonly nextAPIScope: string | undefined;
    /**
     * Checks whether we still have some more api scopes that have not negotiated for their tokens.
     */
    readonly hasMoreAPIScopes: boolean;
    /**
     * Returns all parameters needed to redirect the user to a B2C for login.
     * The parameters will remain the same for the lifetime of this instance.
     */
    readonly loginParams: IB2CLoginRequestParamaters;
    /**
     * Returns all parameters needed to perform an authorization code exchange for an access token.
     * The parameters will remain the same for the lifetime of this instance.
     */
    readonly accessTokenParams: IB2CAccessTokenRequestParameters;
    /**
     * Determines if the current request is a user returning from a login at B2C or a federated service.
     */
    readonly isB2CLoginResponse: boolean;
    /**
     * Determines if the current request is a failure response from B2C of any kind.
     */
    readonly isB2CFailureResponse: boolean;
    readonly reqBodyLoginResponse: IB2CLoginResponseSuccess;
    readonly reqBodyAccessCodeResponse: IB2CAuthorizationCodeExchangeResponseSuccess;
    readonly reqBodyFailureResponse: IB2CLoginResponseFailure | IB2CAuthorizationCodeExchangeResponseFailure;
    session: SessionWrapper<IVeracityAuthFlowSessionData>;
    private _nonce;
    private _state;
    constructor(req: Request, strategySettings: IVeracityAuthFlowStrategySettings);
    /**
     * Returns metadata from session if possible or from endpoint
     */
    getClosestMetadata(): Promise<IVeracityAuthMetadataWithJWKs>;
    /**
     * Returns a complete validation options object that can be used for validating authorization codes
     * or access tokens.
     * @param idToken
     */
    getValidationOptions(idToken: string): Promise<IValidationOptions>;
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
    next(): Promise<string | false>;
    /**
     * Clears any temporary session information used during authentication
     */
    cleanUp(): void;
    private regenerateNonce;
    private regenerateState;
    /**
     * Initialize parameters and session and returns the the url to redirect the user to with all parameters
     */
    private initializeLoginAndReturnLoginUrl;
    /**
     * Checks that the returned data is valid and correct and updates the session with this information for future use.
     */
    private verifyLoginResponseAndUpdateContext;
}
