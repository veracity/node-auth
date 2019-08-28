/**
 * Generic HTTP request error codes.
 */
export enum VIDPRequestErrorCodes {
	/**
	 * A timeout occured when waiting to read data from the server.
	 */
	"read_timeout" = "read_timeout",
	/**
	 * A timeout occurred when waiting to establish a connection to the server.
	 */
	"connect_timeout" = "connect_timeout",
	/**
	 * The request returned a non 200 status code.
	 */
	"status_code_error" = "status_code_error"
}

/**
 * Error codes that may occur when requesting an access token from the VIDP
 */
export enum VIDPAccessTokenErrorCodes {
	// tslint:disable-next-line: max-line-length
	// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow#error-codes-for-token-endpoint-errors

	/**
	 * Protocol error, such as a missing required parameter.
	 */
	"invalid_request" = "invalid_request",
	/**
	 * The authorization code or PKCE code verifier is invalid or has expired.
	 */
	"invalid_grant" = "invalid_grant",
	/**
	 * The authenticated client isn't authorized to use this authorization grant type.
	 */
	"unauthorized_client" = "unauthorized_client",
	/**
	 * Client authentication failed.
	 */
	"invalid_client" = "invalid_client",
	/**
	 * The authorization server does not support the authorization grant type.
	 */
	"unsupported_grant_type" = "unsupported_grant_type",
	/**
	 * The target resource is invalid because it does not exist, Azure AD can't find it, or it's not correctly configured.
	 */
	"invalid_resource" = "invalid_resource",
	/**
	 * The request requires user interaction. For example, an additional authentication step is required.
	 */
	"interaction_required" = "interaction_required",
	/**
	 * The server is temporarily too busy to handle the request.
	 */
	"temporarily_unavailable" = "temporarily_unavailable"
}

/**
 * Error codes that may occur when validating tokens.
 */
export enum VIDPTokenValidationErrorCodes {
	/**
	 * The token is malformed.
	 * It may not consist of three segments or may not be parseable by the `jsonwebptoken` library.
	 */
	"malfomed_token" = "malfomed_token",
	/**
	 * The token is malformed. Its header is missing.
	 */
	"missing_header" = "missing_header",
	/**
	 * The token is malformed. Its payload is missing.
	 */
	"missing_payload" = "missing_payload",
	/**
	 * The token is malformed. Its signature
	 */
	"missing_signature" = "missing_signature",
	/**
	 * The token requested a public key with an id that does not exist in the metadata endpoint.
	 */
	"no_such_public_key" = "no_such_public_key",
	/**
	 * An error occured when verifying the token against nonce, clientId, issuer, tolerance or public key.
	 */
	"verification_error" = "verification_error",
	/**
	 * The token did not match the expected hash
	 */
	"incorrect_hash" = "incorrect_hash"
}

/**
 * Error codes related to strategy setup or execution directly.
 */
export enum VIDPStrategyErrorCodes {
	/**
	 * A required setting was missing. See description for more information.
	 */
	"missing_required_setting" = "missing_required_setting",
	/**
	 * The internal state of the system is not valid. This may occur when users peforms authentication too slowly
	 * or if an attacker is attempting a replay attack.
	 */
	"invalid_internal_state" = "invalid_internal_state",
	/**
	 * An error occured in the verifier function called once the authentication is completed.
	 */
	"verifier_error" = "verifier_error",
	/**
	 * This error code occurs if the system was unable to determine the reason for the error.
	 * Check the error details or innerError for more information.
	 */
	"unknown_error" = "unknown_error"
}

export enum VIDPRefreshTokenErrorCodes {
	/**
	 * Token refresh middleware was unable to resolve the token using the provided resolver.
	 * See description for more details.
	 */
	"cannot_resolve_token" = "cannot_resolve_token"
}
