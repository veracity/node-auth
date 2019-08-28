import { isVIDPError, VIDPAccessTokenErrorCodes, VIDPError, VIDPErrorSources } from "../errors"
import request from "./request"

export interface IRefreshVIDPAccessTokenParams {
	tokenURL: string

	client_id: string
	client_secret?: string
	grant_type?: "refresh_token"
	scope: string
	refresh_token: string
}
export const DEFAULT_REFRESH_VIDP_ACCESS_TOKEN_PARAMS: Required<Pick<IRefreshVIDPAccessTokenParams,
	"grant_type">> & {scope: string} = {
	grant_type: "refresh_token",
	scope: "offline_access"
}

interface IRefreshAccessTokenResponse {
	token_type: "Bearer"
	expires_in: string
	expires_on: string
	resource: string
	access_token: string
	refresh_token: string
}
interface IRefreshAccessTokenRequestError {
	error: VIDPAccessTokenErrorCodes,
	error_description: string
	error_codes: number[]
	timestamp: string
	trace_id: string
	correlation_id: string
}

export const refreshVIDPAccessToken = async (params: IRefreshVIDPAccessTokenParams) => {
	const {tokenURL, ...restParams} = {
		...DEFAULT_REFRESH_VIDP_ACCESS_TOKEN_PARAMS,
		...params
	}

	try {
		const response = await request(tokenURL, {
			method: "POST",
			form: restParams
		})
		return JSON.parse(response) as IRefreshAccessTokenResponse
	} catch (error) {
		if (isVIDPError(error)) {
			error.source = VIDPErrorSources.refreshAccessTokenRequest
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
		if (isRefreshAccessTokenRequestError(error)) {
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

export const isRefreshAccessTokenRequestError = (error: any): error is IRefreshAccessTokenRequestError => {
	return !!error.error && !!error.error_description
}
