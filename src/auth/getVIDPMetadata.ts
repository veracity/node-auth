import { VERACITY_METADATA_ENDPOINT } from "../constants"
import { isVIDPError, VIDPError, VIDPErrorSources } from "../errors"
import {
	IVIDPJWKWithPEM,
	IVIDPMetadatWithJWKs
} from "../internalInterfaces/VIDPReqRes"
import { generatePEM } from "../utils/generatePEM"
import { memCacheInstance } from "../utils/MemCache"
import request from "./request"

const METADATA_MEMCACHE_KEY_PREFIX = "__VIDP_METADATA__"
const METADATA_REFRESH_INTERVAL = 1000 * 60 * 5 // every 5 minutes

const makeCacheKey = (metadataURL: string) => METADATA_MEMCACHE_KEY_PREFIX+metadataURL

/**
 * Requests metadata for a tenant with an obligatory
 * @param tenantId
 * @param policy
 */
export const getMetadata = async (metadataURL: string): Promise<IVIDPMetadatWithJWKs> => {
	const metadataString = await request(metadataURL)
	const metadata: IVIDPMetadatWithJWKs = JSON.parse(metadataString)

	const jwksString = await request(metadata.jwks_uri)
	const jwks: IVIDPJWKWithPEM[] = JSON.parse(jwksString).keys

	return {
		...metadata,
		jwks: jwks.map((aJWK) => ({
			...aJWK,
			pem: generatePEM(aJWK.n, aJWK.e)
		}))
	}
}

const refreshVIDPMetadata = async (metadataURL: string) => {
	const metadata = await getMetadata(metadataURL)
	memCacheInstance.set(
		makeCacheKey(metadataURL),
		metadata,
		METADATA_REFRESH_INTERVAL,
		() => refreshVIDPMetadata(metadataURL))
	return metadata
}

/**
 * Fetches metadata information from the Veracity IDP.
 * Will cache in local memCacheInstance and keep it up to date for better performance.
 */
export const getVIDPMetadata = async (metadataURL?: string) => {
	metadataURL = metadataURL || VERACITY_METADATA_ENDPOINT
	let metadata = memCacheInstance.get<IVIDPMetadatWithJWKs>(makeCacheKey(metadataURL))
	if (!metadata) {
		try {
			metadata = await refreshVIDPMetadata(metadataURL)
		} catch (error) {
			if (isVIDPError(error)) {
				error.source = VIDPErrorSources.metadataRequest
				throw error
			}
			throw new VIDPError(
				undefined,
				"Unknown metadata request error. See innerError for details.",
				VIDPErrorSources.metadataRequest, undefined, error)
		}
	}
	return metadata
}
