// tslint:disable: max-line-length
//
// This file contains interfaces for all the responses expected from the Veracity IDP
// Refs:
// https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-openid-connect-code#error-codes-for-authorization-endpoint-errors
// https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc

/**
 * Describes a successful login response from b2c.
 */
export interface IVIDPAuthResponseSuccess {
	id_token: string
	state: string
	/**
	 * Code is only populated if "code" is passed in response_type
	 */
	code?: string
}
/**
 * Describes a failed login response from b2c.
 */
export interface IVIDPAuthResponseFailure {
	error: string
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
	error: string
	error_description: string
}

export interface IVIDPRefreshTokenResponseSuccess {
	access_token: string
	expires_in: string
	expires_on: string
	id_token: string
	id_token_expires_in: string
	not_before: string
	profile_info: string
	resource: string
	token_type: "Bearer"
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

/**
 * Describes the parameters needed to refresh a token.
 */
export interface IVIDPRefreshTokenRequestParameters {
	grant_type: "refresh_token"
	client_id: string
	client_secret: string
	refresh_token: string
	redirect_uri: string
	scope: string
	nonce: string
}

export const isVIDPLoginResponse = (obj: any): obj is IVIDPAuthResponseSuccess => !!(
	obj.id_token && obj.code && obj.state
)
export const isVIDPAuthorizationCodeExchangeResponse = (obj: any): obj is IVIDPAuthorizationCodeExchangeResponseSuccess => !!(
	obj.not_before && obj.token_type && obj.access_token && obj.expires_in
)
export const isVIDPLoginResponseFailure = (obj: any): obj is IVIDPAuthResponseFailure => !!(
	obj.error && obj.error_description && obj.state
)
export const isVIDPResponseFailure = (obj: any): obj is IVIDPAuthorizationCodeExchangeResponseFailure => !!(
	obj.error && obj.error_description
)

/**
 * Describes a Veracity JWK entry as seen from the Veracity IDP.
 */
export interface IVIDPJWK {
	kid: string
	e: string
	n: string
}

/**
 * Describes a Veracity JWK entry with a generated public key.
 */
export interface IVIDPJWKWithPEM extends IVIDPJWK {
	pem: string
}
/**
 * Describes the data returned from a direct call to the metadata endpoint
 * using the proper policy parameter.
 */
export interface IVIDPMetadata {
	issuer: string
	authorization_endpoint: string
	token_endpoint: string
	end_session_endpoint: string
	jwks_uri: string

	response_modes_supported: string[]
	response_types_supported: string[]
	scopes_supported: string[]
	subject_types_supported: string[]
	id_token_signing_alg_values_supported: string[]
	token_endpoint_auth_methods_supported: string[]
	claims_supported: string[]
}

/**
 * Describes the metadata returned from the Veracity IDP metadata endpoint with JWKs that include PEMs.
 */
export interface IVIDPMetadatWithJWKs extends IVIDPMetadata {
	jwks: IVIDPJWKWithPEM[]
}