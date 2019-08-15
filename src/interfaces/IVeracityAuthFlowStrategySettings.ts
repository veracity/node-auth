import { IVeracityAuthFlowStrategyVerifierOptions } from "./IVeracityAuthFlowStrategyVerifierOptions"

export interface IVeracityAuthFlowStrategySettings {
	/**
	 * The id of the Veracity tenant you are authenticating with.
	 */
	tenantId: string
	/**
	 * The name of the authenication policy.
	 */
	policy: string

	/**
	 * The client id from the Application Credentials you created in the Veracity for Developers Provider Hub
	 */
	clientId: string
	/**
	 * The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub
	 */
	clientSecret: string
	/**
	 * The redirect url from the Application Credentials you created in the Veracity for Developers Provider Hub
	 */
	redirectUri: string

	/**
	 * If true retrieves a refresh token for each api scope in addition to the access token.
	 */
	requestRefreshTokens?: boolean

	/**
	 * The scopes you wish to authenticate with. An access token will be retrieved for each api scope.
	 * If you only wish to authenticate with Veracity you can ignore this setting.
	 */
	apiScopes?: string[]

	/**
	 * A function that receives all the final tokens and data.
	 */
	verifier: (options: IVeracityAuthFlowStrategyVerifierOptions) => void | Promise<void>

	/**
	 * Contains configuration for strategy internals.
	 */
	configuration?: {
		/**
		 * The number of seconds to keep metadata configuration cached locally.
		 * Setting this can drastically reduce the time it takes to log in by not requiring that the back end
		 * refetches metadata every time it is needed.
		 * Do not set it too large as it may become stale. Recommended value ~120
		 */
		keepMetadataFor?: number
	}
}
