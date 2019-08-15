import { IVeracityAuthMetadataWithJWKs } from "./IVeracityAuthMetadata"
import { IVeracityTokenData } from "./IVeracityTokenData"
import { IVeracityIDToken } from "./veracityTokens"

export interface IVeracityAuthFlowSessionData {
	metadata: IVeracityAuthMetadataWithJWKs
	tokens?: {[scope: string]: IVeracityTokenData}
	lastIdToken: string
	lastIdTokenDecoded: IVeracityIDToken
	state: string
	nonce: string
}
