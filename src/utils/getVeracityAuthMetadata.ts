import { IVeracityAuthMetadataWithJWKs, IVeracityJWKWithPEM } from "../internalInterfaces/veracityIDPReqRes"
import { generatePEM } from "./generatePEM"
import request from "./request"

export interface IVeracityMetadataOptions {
	/**
	 * The id of the B2C tenant used for Veracity authentication.
	 */
	tenantId: string
	/**
	 * The name of the policy to use when authenticating with the Veracity B2C tenant.
	 */
	policy: string
}

/**
 * This function retrieves all metadata for the Veracity tenant in B2C including JWK keys and computes the
 * proper public keys for it.
 * @param options
 */
export const getVeracityAuthMetadata =
	async (options: IVeracityMetadataOptions): Promise<IVeracityAuthMetadataWithJWKs> => {
	const metadataEndpoint =
		`https://login.microsoftonline.com/${options.tenantId}/v2.0/.well-known/openid-configuration?p=${options.policy}`

	const metadataString = await request(metadataEndpoint)
	const metadata: IVeracityAuthMetadataWithJWKs = JSON.parse(metadataString)

	const jwksString = await request(metadata.jwks_uri)
	const jwks: IVeracityJWKWithPEM[] = JSON.parse(jwksString).keys

	return {
		...metadata,
		jwks: jwks.map((aJWK) => ({
			...aJWK,
			pem: generatePEM(aJWK.n, aJWK.e)
		}))
	}
}

export default getVeracityAuthMetadata
