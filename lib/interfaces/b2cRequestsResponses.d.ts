/**
 * This file contains interfaces for all the responses expected from B2C.
 * Refs:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-openid-connect-code#error-codes-for-authorization-endpoint-errors
 * https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
 */
/**
 * Describes the known error codes that b2c may return in a failed response.
 */
export declare type B2CErrorCodes = "invalid_request" | "unauthorized_client" | "access_denied" | "unsupported_response_type" | "server_error" | "temporarily_unavailable" | "invalid_resource";
/**
 * Describes a successful login response from b2c containing the authorization code.
 */
export interface IB2CLoginResponseSuccess {
    id_token: string;
    code: string;
    state: string;
}
/**
 * Describes a failed login response from b2c.
 */
export interface IB2CLoginResponseFailure {
    error: B2CErrorCodes;
    error_description: string;
    state: string;
}
/**
 * Describes a successful response when exchanging an authorization code for an access token
 * with optional refresh token.
 */
export interface IB2CAuthorizationCodeExchangeResponseSuccess {
    not_before: string;
    token_type: "Bearer";
    access_token: string;
    expires_in: string;
    refresh_token?: string;
    refresh_token_expires_in?: string;
}
/**
 * Describes a failed authorization code exchange response.
 */
export interface IB2CAuthorizationCodeExchangeResponseFailure {
    error: B2CErrorCodes;
    error_description: string;
}
/**
 * Describes the parameters required in the url of a request to log a user in.
 * These should be sent as url encoded query parameters.
 */
export interface IB2CLoginRequestParamaters {
    client_id: string;
    redirect_uri: string;
    response_type: "code id_token";
    response_mode: "form_post";
    scope: string;
    state: string;
    nonce: string;
}
/**
 * Describes the parameters required for a request to exchange an authorization code for an access token.
 * These should be sent as form post parameters.
 */
export interface IB2CAccessTokenRequestParameters {
    client_id: string;
    client_secret: string;
    grant_type: "authorization_code";
    scope: string;
    code: string;
    redirect_uri: string;
}
export declare const isB2CLoginResponse: (obj: any) => obj is IB2CLoginResponseSuccess;
export declare const isB2CAuthorizationCodeExchangeResponse: (obj: any) => obj is IB2CAuthorizationCodeExchangeResponseSuccess;
export declare const isB2CLoginResponseFailure: (obj: any) => obj is IB2CLoginResponseFailure;
export declare const isB2CResponseFailure: (obj: any) => obj is IB2CAuthorizationCodeExchangeResponseFailure;
