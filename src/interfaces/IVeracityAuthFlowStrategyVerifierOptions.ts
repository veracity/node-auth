import { IVeracityTokenData } from "./IVeracityTokenData"
import { IVeracityIDTokenPayload } from "./veracityTokens"

export interface IVeracityAuthFlowStrategyVerifierOptions {
	/**
	 * The full ID token
	 */
	idToken: string
	/**
	 * The decoded ID token payload (header and signature not included)
	 */
	idTokenDecoded: IVeracityIDTokenPayload

	/**
	 * Contains all access tokens and associated refresh tokens negotiated by the system.
	 * Tokens are indexed by the scope string.
	 */
	tokens: {[scope: string]: IVeracityTokenData}
}
