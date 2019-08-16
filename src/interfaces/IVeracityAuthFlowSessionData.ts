import { IVeracityAuthMetadataWithJWKs } from "./IVeracityAuthMetadata"
import { IVeracityTokenData } from "./IVeracityTokenData"

export interface IVeracityAuthFlowSessionData {
	metadata: IVeracityAuthMetadataWithJWKs
	state: string
	nonce: string
	/**
	 * The scope that is currently being authenticated.
	 */
	apiScope?: string

	/**
	 * All access tokens that have been negotiated and validated.
	 */
	tokens?: {[scope: string]: IVeracityTokenData}
}
