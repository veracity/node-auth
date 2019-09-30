// tslint:disable: max-line-length
import { VERACITY_POLICY, VERACITY_TENANT_ID } from "../src"
import { IVIDPJWKWithPEM, IVIDPMetadata, IVIDPMetadatWithJWKs } from "../src/internalInterfaces/VIDPReqRes"

export const endpointMeta = `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/v2.0/.well-known/openid-configuration?p=${VERACITY_POLICY}`
export const endpointJWK = `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/discovery/v2.0/keys?p=${VERACITY_POLICY}`
export const mockMetadata: IVIDPMetadata = {
	issuer: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/v2.0/`,
	authorization_endpoint: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/oauth2/v2.0/authorize?p=${VERACITY_POLICY}`,
	token_endpoint: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/oauth2/v2.0/token?p=${VERACITY_POLICY}`,
	end_session_endpoint: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/oauth2/v2.0/logout?p=${VERACITY_POLICY}`,
	jwks_uri: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/discovery/v2.0/keys?p=${VERACITY_POLICY}`,
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
export const mockJWKResponse: {keys: IVIDPJWKWithPEM[] & any} = {
	keys: [
		{
			kid: "egE8-_RcPdNjT_XFT6M9gNvrSoz9v7Nr6Br4wkbL1mg",
			use: "sig",
			kty: "RSA",
			e: "AQAB",
			n: "m8ERKy4HMAMHgejt2vFgckk5SwbP2ZcukKgIYA_eN1tGgniX6_dKQVSonrClvFoXQE9ENnv91QCtL17WCTQqVk3z8cp1G006siP9_jo9VnKAOBtnWiwzo9ip6AnCgcGcBomlruxDGrtNZVRhFr_putP4RdZzFyvCOyy6Ck2zQ2kQU0N6BL03krvGYZqf6Ini8e2aeLhCuK8UClbbdjdqVB4Y2lCfWlR9KDgRZ10wOScHh_CL0_6182dNYsK7DB7xvnh5wNFuekLEf2qKQxjqJFMvPwqbO_sGCA3xwhv-IvYFm9CSFGNcbq1J6VrLs9zEBqVgpSO21-dwx6dC44WUow",
			pem: "-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAm8ERKy4HMAMHgejt2vFgckk5SwbP2ZcukKgIYA/eN1tGgniX6/dK\nQVSonrClvFoXQE9ENnv91QCtL17WCTQqVk3z8cp1G006siP9/jo9VnKAOBtnWiwz\no9ip6AnCgcGcBomlruxDGrtNZVRhFr/putP4RdZzFyvCOyy6Ck2zQ2kQU0N6BL03\nkrvGYZqf6Ini8e2aeLhCuK8UClbbdjdqVB4Y2lCfWlR9KDgRZ10wOScHh/CL0/61\n82dNYsK7DB7xvnh5wNFuekLEf2qKQxjqJFMvPwqbO/sGCA3xwhv+IvYFm9CSFGNc\nbq1J6VrLs9zEBqVgpSO21+dwx6dC44WUowIDAQAB\n-----END RSA PUBLIC KEY-----\n"
		}
	]
}
export const mockFullMetadata: IVIDPMetadatWithJWKs = {
	...mockMetadata,
	jwks: mockJWKResponse.keys
}
