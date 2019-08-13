// tslint:disable: max-line-length

import request from "request-promise"
import getVeracityAuthMetadataDefault, { getVeracityAuthMetadata } from "./getVeracityAuthMetadata"

jest.mock("request-promise")
const requestMock: jest.Mock = request as any
const tenantId = "dummy-tenant-id"
const policy = "dummy-policy"

const endpointMeta = `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration?p=${policy}`
const endpointJWK = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys?p=${policy}`
const metaResponse = {
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
const jwkResponse = {
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
const fullResponse = {
	...metaResponse,
	jwks: jwkResponse.keys
}

requestMock.mockImplementation((endpoint) => {
	if (endpoint === endpointMeta) {
		return Promise.resolve(JSON.stringify(metaResponse))
	}
	if (endpoint === endpointJWK) {
		return Promise.resolve(JSON.stringify(jwkResponse))
	}

	throw new Error(`Endpoint url not mocked "${endpoint}"`)
})

describe("getVeracityAuthMetadata", () => {
	it("should be defined", () => {
		expect(typeof getVeracityAuthMetadata).toBe("function")
		expect(typeof getVeracityAuthMetadataDefault).toBe("function")
	})
	it("should export named and default", () => {
		expect(getVeracityAuthMetadata).toBe(getVeracityAuthMetadataDefault)
	})
	it("should respond with a properly formatted metadata object", async () => {
		const result = await getVeracityAuthMetadata({ tenantId, policy })
		expect(result).toEqual(fullResponse)
	})
})
