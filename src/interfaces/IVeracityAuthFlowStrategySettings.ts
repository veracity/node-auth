export interface IVeracityAuthFlowStrategySettings {
	/**
	 * The id of the Veracity tenant you are authenticating with.
	 * @default "a68572e3-63ce-4bc1-acdc-b64943502e9d"
	 */
	tenantId?: string
	/**
	 * The name of the authenication policy.
	 * @default "B2C_1A_SignInWithADFSIdp"
	 */
	policy?: string
	/**
	 * Where to redirect the user after logging out. You should not set this unless you know what you're doing
	 * @default "https://www.veracity.com/auth/logout"
	 */
	logoutRedirectUrl?: string

	/**
	 * The client id from the Application Credentials you created in the Veracity for Developers Provider Hub
	 */
	clientId: string
	/**
	 * The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub
	 */
	clientSecret: string
	/**
	 * The reply url from the Application Credentials you created in the Veracity for Developers Provider Hub
	 */
	replyUrl: string

	/**
	 * If true retrieves a refresh token for each api scope in addition to the access token.
	 * @default true
	 */
	requestRefreshTokens?: boolean

	/**
	 * The scopes you wish to authenticate with. An access token will be retrieved for each api scope.
	 * If you only wish to authenticate with Veracity you can ignore this setting.
	 * @default ["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"]
	 */
	apiScopes?: string[]
}
