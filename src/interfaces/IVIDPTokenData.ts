import { IVIDPAccessTokenData } from "./IVIDPAccessToken"
import { IVIDPIDTokenData } from "./IVIDPIDToken"

/**
 * The complete set of all token data returned from the IDP
 */
export interface IVIDPTokenData {
	/**
	 * The parsed identity token.
	 */
	idToken: IVIDPIDTokenData
	/**
	 * Any access tokens recievied indexed by their associated scope.
	 */
	accessTokens: {[apiScope: string]: IVIDPAccessTokenData}
}
