import { combineParams, encodeURIParams } from "../utils/uriParams"

export interface ICreateVIDPAuthorizationUrlParams {
	authorizationURL: string

	client_id: string
	redirect_uri: string
	scope?: string
	response_type?: "id_token" | "code id_token"
	response_mode?: "query" | "form_post"
	state?: string

	prompt?: "login" | "none" | "consent"
	login_hint?: string
	domain_hint?: string
	code_challenge_method?: "plain" | "S256"
	code_challenge?: string
}

export const DEFAULT_VIDP_AUTHORIZATION_URL_PARAMS: Required<Pick<ICreateVIDPAuthorizationUrlParams,
	"scope" | "response_type" | "response_mode">> = {
	scope: "openid offline_access",
	response_type: "code id_token",
	response_mode: "form_post"
}

/**
 * Given a set of parameters will construct the full authorization url for the Veracity IDP
 * authorization code exchange endpoint.
 */
export const createVIDPAuthorizationUrl = (params: ICreateVIDPAuthorizationUrlParams) => {
	const {authorizationURL, ...restParams} = {
		...DEFAULT_VIDP_AUTHORIZATION_URL_PARAMS,
		...params
	}

	return authorizationURL +
		(authorizationURL.indexOf("?") >= 0 ? "&" : "?") +
		combineParams(encodeURIParams(restParams)).join("&")
}
