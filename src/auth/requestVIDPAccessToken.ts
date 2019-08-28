import { isVIDPError, VIDPAccessTokenErrorCodes, VIDPError, VIDPErrorSources } from "../errors"
import request from "./request"

export interface IRequestVIDPAccessTokenParams {
	tokenURL: string

	client_id: string
	client_secret?: string
	grant_type?: "authorization_code"
	scope?: string
	code: string
	redirect_uri: string
	code_verifier?: string
}
export const DEFAULT_REQUEST_VIDP_ACCESS_TOKEN_PARAMS: Required<Pick<IRequestVIDPAccessTokenParams,
	"grant_type">> & {scope: string} = {
	grant_type: "authorization_code",
	scope: "openid offline_access"
}
interface IAccessTokenRequestResponse {
	access_token: string
	token_type: string
	expires_in: number
	scope: string
	refresh_token: string
	id_token: string
}
interface IAccessTokenRequestError {
	error: VIDPAccessTokenErrorCodes,
	error_description: string
	error_codes: number[]
	timestamp: string
	trace_id: string
	correlation_id: string
}

/**
 * Perform an access token request to VIDP using the provided authorization code.
 * @param accessTokenEndpointURI
 */
export const requestVIDPAccessToken = async (params: IRequestVIDPAccessTokenParams) => {
	const {tokenURL, ...restParams} = {
		...DEFAULT_REQUEST_VIDP_ACCESS_TOKEN_PARAMS,
		...params
	}

	try {
		const response = await request(tokenURL, {
			method: "POST",
			form: restParams
		})
		return JSON.parse(response) as IAccessTokenRequestResponse
	} catch (error) {
		if (isVIDPError(error)) {
			error.source = VIDPErrorSources.accessTokenRequest
			throw error
		}
		if (error.statusCode) {
			// This is a status code error
			const message = JSON.parse(error.error) as {error: string, error_description: string}
			throw new VIDPError(
				message.error,
				message.error_description,
				VIDPErrorSources.accessTokenRequest,
				{
					...restParams,
					client_secret: !!restParams.client_secret
				},
				error
			)
		}
		if (isAccessTokenRequestError(error)) {
			throw new VIDPError(
				error.error,
				error.error_description,
				VIDPErrorSources.accessTokenRequest,
				error
			)
		}
		throw error
	}
}

export const isAccessTokenRequestError = (error: any): error is IAccessTokenRequestError => {
	return !!error.error && !!error.error_description
}
