/**
 * Describes the distinct operations that may spawn this error
 */
export enum VIDPErrorSources {
	/**
	 * The error occurred while attempting to read metadata from the Veracity IDP.
	 */
	"metadataRequest" = "metadataRequest",
	/**
	 * THe error occured while attempting to get an authorization code.
	 */
	"authCodeRequest" = "authCodeRequest",
	/**
	 * The error occurred while attempting to exchange an auth code for an access code.
	 */
	"accessTokenRequest" = "accessTokenRequest",
	/**
	 * The error occurred while attempting to exchange a refresh token for an access code.
	 */
	"refreshAccessTokenRequest" = "refreshAccessTokenRequest",
	/**
	 * The error occured during a generic request to a server.
	 */
	"request" = "request",
	/**
	 * The error occurred during token validation.
	 */
	"tokenValidation" = "tokenValidation",
	/**
	 * The error occured when setting up or using a strategy.
	 */
	"strategy" = "strategy",
	/**
	 * The error occurred within a verifier function in external code.
	 */
	"verifier" = "verifier",
	/**
	 * The error occurred during some other operation.
	 */
	"other" = "other"
}

/**
 * Describes a generic VIDPError that may spawn from any source within the library.
 */
export class VIDPError<TDetails extends {[key: string]: any} = {}> extends Error {
	/**
	 *
	 * @param code The error code or `unknown_error` if not known
	 * @param description The error description
	 * @param source The source operation of the error
	 * @param details Any additional detailsprovided by the error.
	 * @param innerError If applicable the inner exception that occurred.
	 */
	public constructor(
		public code: string = "unknown_error",
		public description: string = "Unknown error",
		public source: VIDPErrorSources = VIDPErrorSources.other,
		public details: TDetails = {} as any,
		public innerError?: Error
	) {
		super(description)
	}
}

export const isVIDPError = <TDetails extends {[key: string]: any} = {}>(error: Error): error is VIDPError<TDetails> => {
	return error instanceof VIDPError
}
