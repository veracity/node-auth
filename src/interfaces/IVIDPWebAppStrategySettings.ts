export interface IVIDPWebAppStrategySettings {
	/**
	 * The client id from the Application Credentials you created in the Veracity for Developers Provider Hub.
	 */
	clientId: string
	/**
	 * The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub.
	 * Required for web applications, but not for native applications.
	 */
	clientSecret?: string
	/**
	 * The reply url from the Application Credentials you created in the Veracity for Developers Provider Hub.
	 */
	replyUrl: string

	/**
	 * The scopes you wish to authenticate with. An access token will be retrieved for each api scope.
	 * If you only wish to authenticate with Veracity you can ignore this or set it to an empty array to
	 * slightly improve performance.
	 * @default ["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"]
	 */
	apiScopes?: string[]
	/**
	 * The url where metadata about the IDP can be found.
	 * Defaults to the constant VERACITY_METADATA_ENDPOINT.
	 * @default VERACITY_METADATA_ENDPOINT
	 */
	metadataURL?: string
}