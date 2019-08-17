/**
 * These are the default settings recommeded for authenticating with Veracity.
 * You can combine these with your applications custom settings to quickly get up and running.
 */
export const defaultAuthFlowStrategySettings = {
	tenantId: "a68572e3-63ce-4bc1-acdc-b64943502e9d",
	policy: "B2C_1A_SignInWithADFSIdp",
	apiScopes: [
		"https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"
	],
	requestRefreshTokens: true,
	configuration: {
		keepMetadataFor: 120
	}
}
