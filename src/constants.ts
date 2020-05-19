/**
 * The tenant id for the Veracity Identity Provider.
 */
export const VERACITY_TENANT_ID = "a68572e3-63ce-4bc1-acdc-b64943502e9d"

/**
 * The default policy for Veracity Identity Provider calls that ask for it.
 */
export const VERACITY_POLICY = "B2C_1A_SignInWithADFSIdp"

/**
 * The scopes for Veracity APIs that are used to request access tokens.
 */
export const VERACITY_API_SCOPES = {
	services: "https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation",
	dataFabric: "https://dnvglb2cprod.onmicrosoft.com/37c59c8d-cd9d-4cd5-b05a-e67f1650ee14/user_impersonation"
}

/**
 * The logout url for centralized logout.
 */
export const VERACITY_LOGOUT_URL = "https://www.veracity.com/auth/logout"

/**
 * The full URL for metadata about the Veracity IDP.
 */
export const VERACITY_METADATA_ENDPOINT =
	`https://login.microsoftonline.com/${VERACITY_TENANT_ID}/v2.0/.well-known/openid-configuration`
