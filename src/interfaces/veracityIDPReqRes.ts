// tslint:disable: max-line-length
/**
 * This file contains interfaces for all the responses expected from the Veracity IDP
 * Refs:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-openid-connect-code#error-codes-for-authorization-endpoint-errors
 * https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
 */

/**
 * Describes the known error codes that b2c may return in a failed response.
 */
export type VIDPErrorCodes =
	"invalid_request" |
	"unauthorized_client" |
	"access_denied" |
	"unsupported_response_type" |
	"server_error" |
	"temporarily_unavailable" |
	"invalid_resource"

/**
 * Describes a successful login response from b2c containing the authorization code.
 */
export interface IVIDPLoginResponseSuccess {
	id_token: string
	code: string
	state: string
}
/**
 * Describes a failed login response from b2c.
 */
export interface IVIDPLoginResponseFailure {
	error: VIDPErrorCodes
	error_description: string
	state: string
}

/**
 * Describes a successful response when exchanging an authorization code for an access token
 * with optional refresh token.
 */
export interface IVIDPAuthorizationCodeExchangeResponseSuccess {
	not_before: string
	token_type: "Bearer"
	access_token: string
	expires_in: string
	expires_on: string
	id_token: string
	id_token_expires_in: string
	profile_info: string
	refresh_token?: string
	refresh_token_expires_in?: string
	resource: string
}
/**
 * Describes a failed authorization code exchange response.
 */
export interface IVIDPAuthorizationCodeExchangeResponseFailure {
	error: VIDPErrorCodes
	error_description: string
}

/**
 * Describes the parameters required in the url of a request to log a user in.
 * These should be sent as url encoded query parameters.
 */
export interface IVIDPLoginRequestParamaters {
	client_id: string
	redirect_uri: string
	response_type: "code id_token"
	response_mode: "form_post"
	scope: string
	state: string
	nonce: string
}
/**
 * Describes the parameters required for a request to exchange an authorization code for an access token.
 * These should be sent as form post parameters.
 */
export interface IVIDPAccessTokenRequestParameters {
	client_id: string
	client_secret: string
	grant_type: "authorization_code"
	scope: string
	code: string
	redirect_uri: string
}

export const isVIDPLoginResponse = (obj: any): obj is IVIDPLoginResponseSuccess => !!(
	obj.id_token && obj.code && obj.state
)
export const isVIDPAuthorizationCodeExchangeResponse = (obj: any): obj is IVIDPAuthorizationCodeExchangeResponseSuccess => !!(
	obj.not_before && obj.token_type && obj.access_token && obj.expires_in
)
export const isVIDPLoginResponseFailure = (obj: any): obj is IVIDPLoginResponseFailure => !!(
	obj.error && obj.error_description && obj.state
)
export const isVIDPResponseFailure = (obj: any): obj is IVIDPAuthorizationCodeExchangeResponseFailure => !!(
	obj.error && obj.error_description
)
