// tslint:disable: max-line-length
import {
	IVeracityAuthMetadata,
	IVeracityAuthMetadataWithJWKs,
	IVeracityJWKWithPEM
} from "../src/interfaces"
import { mockAuthFlowStrategySettings } from "./mockAuthFlowStrategySettings"

const {tenantId, policy} = mockAuthFlowStrategySettings

export const endpointMeta = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration?p=${policy}`
export const endpointJWK = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys?p=${policy}`
export const mockMetaResponse: IVeracityAuthMetadata = {
	issuer: `https://login.microsoftonline.com/${tenantId}/v2.0/`,
	authorization_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?p=${policy}`,
	token_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token?p=${policy}`,
	end_session_endpoint: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?p=${policy}`,
	jwks_uri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys?p=${policy}`,
	response_modes_supported: [
		"query",
		"fragment",
		"form_post"
	],
	response_types_supported: [
		"code",
		"code id_token",
		"code token",
		"code id_token token",
		"id_token",
		"id_token token",
		"token",
		"token id_token"
	],
	scopes_supported: [
		"openid"
	],
	subject_types_supported: [
		"pairwise"
	],
	id_token_signing_alg_values_supported: [
		"RS256"
	],
	token_endpoint_auth_methods_supported: [
		"client_secret_post",
		"client_secret_basic"
	],
	claims_supported: [
		"userId",
		"dnvglAccountName",
		"myDnvglGuid",
		"oid",
		"name",
		"given_name",
		"family_name",
		"sub",
		"email",
		"upn",
		"iss",
		"iat",
		"exp",
		"aud",
		"acr",
		"nonce",
		"auth_time"
	]
}
export const mockJWKResponse: {keys: IVeracityJWKWithPEM[] & any} = {
	keys: [
		{
			kid:"dummy-kid",
			use:"sig",
			kty:"RSA",
			e:"AQAB",
			n:"oRRQG-ib30x09eWtDpL0wWahA-hgjc0lWoQU4lwBFjXV2PfPImiAvwxOxNG34Mgnw3K9huBYLsrvOQAbMdBmE8lwz8DFKMWqHqoH3xSqDGhIYFobQDiVRkkecpberH5hqJauSD7PiwDBSQ_RCDIjb0SOmSTpZR97Ws4k1z9158VRf4BUbGjzVt4tUAz_y2cI5JsXQfcgAPB3voP8eunxGwZ_iM8evw3hUOw7-nuiPyts7HSkvV6GMwrXfOymY_w07mYxw_2LnKInfsWBtcRIDG-Nrsj237LgtBhK7TkzuVrguq__-bkDwwF3qTRXGAX9KrwY4huRxDRslMIg30Hqgw",
			pem: `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAoRRQG+ib30x09eWtDpL0wWahA+hgjc0lWoQU4lwBFjXV2PfPImiA
vwxOxNG34Mgnw3K9huBYLsrvOQAbMdBmE8lwz8DFKMWqHqoH3xSqDGhIYFobQDiV
RkkecpberH5hqJauSD7PiwDBSQ/RCDIjb0SOmSTpZR97Ws4k1z9158VRf4BUbGjz
Vt4tUAz/y2cI5JsXQfcgAPB3voP8eunxGwZ/iM8evw3hUOw7+nuiPyts7HSkvV6G
MwrXfOymY/w07mYxw/2LnKInfsWBtcRIDG+Nrsj237LgtBhK7TkzuVrguq//+bkD
wwF3qTRXGAX9KrwY4huRxDRslMIg30HqgwIDAQAB
-----END RSA PUBLIC KEY-----
`
		}
	]
}
export const mockFullMetadata: IVeracityAuthMetadataWithJWKs = {
	...mockMetaResponse,
	jwks: mockJWKResponse.keys
}
