// tslint:disable: max-line-length
// tslint:disable: no-var-requires
// tslint:disable: no-string-literal

import { mockFullMetadata } from "../../test/mockMetadata"
import { mockAccessToken, mockIdToken } from "../../test/mockTokens"
import { IVIDPOpenIDSettings, VIDPOpenIDContext } from "./VIDPOpenIDContext"

jest.mock("../auth/requestVIDPAccessToken", () => ({
	requestVIDPAccessToken: jest.fn(),
	DEFAULT_REQUEST_VIDP_ACCESS_TOKEN_PARAMS: {
		scope: "openid offline_access"
	}
}))
jest.mock("../auth/tokenValidators", () => ({
	validateVIDPToken: jest.fn(),
	validateVIDPAuthorizationCode: jest.fn(),
	validateHash: jest.fn()
}))

const {
	validateVIDPToken,
	validateVIDPAuthorizationCode
} = require("../auth/tokenValidators") as {
	validateVIDPToken: jest.Mock,
	validateVIDPAuthorizationCode: jest.Mock,
	validateHash: jest.Mock
}
const {
	requestVIDPAccessToken
} = require("../auth/requestVIDPAccessToken") as {
	requestVIDPAccessToken: jest.Mock
}

const mockCache = {
	set: jest.fn((key: any, data: any) => data),
	remove: jest.fn(),
	get: jest.fn()
}

const HTTPVerbs = {
	get: "GET",
	post: "POST"
}

const mockAuthParams = {
	client_id: "123123123123",
	redirect_uri: "https://localhost:3000/auth/oidc/loginreturn"
}
const mockAccessTokenParams = {
	client_id: mockAuthParams.client_id,
	redirect_uri: mockAuthParams.redirect_uri
}

describe("VIDPOpenIDContext", () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})
	it("is a constructor function", () => {
		expect(VIDPOpenIDContext).toBeDefined()
		expect(typeof VIDPOpenIDContext).toBe("function")
	})
	describe("no api scopes", () => {
		const mockSettings: IVIDPOpenIDSettings = {
			authParams: mockAuthParams,
			accessTokenParams: mockAccessTokenParams
		}
		describe("login", () => {
			const mockRequest: any = {
				method: HTTPVerbs.get,
				query: {}
			}
			it("can be constructed", () => {
				let instance: VIDPOpenIDContext = undefined as any
				expect(() => {
					instance = new VIDPOpenIDContext(
						mockRequest,
						mockSettings,
						mockFullMetadata,
						mockCache
					)
				}).not.toThrow()
				expect(instance).toBeDefined()
				expect(instance.req).toBe(mockRequest)
				expect(instance.settings).toBe(mockSettings)
				expect(instance.metadata).toBe(mockFullMetadata)
			})
			it("returns expected context state", () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const contextState = instance["_contextState"]
				expect(contextState.data).toEqual({})
				expect(contextState.query).toEqual({})
				expect(typeof contextState.stateKey).toBe("string")
				expect(contextState.currentScope).not.toBeDefined()
				expect(contextState.accessTokens).not.toBeDefined()
				expect(contextState.idToken).not.toBeDefined()
			})
			it("returns undefined authResponseParams", () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				expect(instance["_authResponseParams"]).not.toBeDefined()
			})
			it("returns undefined authResponseError", () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				expect(instance["_authResponseError"]).not.toBeDefined()
			})
			it("returns first login url with proper params when calling next()", async () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const nextResult = await instance.next()
				const state = instance["_currentContextState"]!.stateKey
				expect(nextResult).toEqual(`https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/oauth2/v2.0/authorize?p=B2C_1A_SignInWithADFSIdp&scope=openid%20offline_access&response_type=code%20id_token&response_mode=form_post&client_id=123123123123&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Floginreturn&state=${state}`)
			})
		})
		describe("next()", () => {
			const mockLoginRequest: any = {
				method: HTTPVerbs.get,
				query: {
					someParameter: true,
					anotherParameter: 42
				},
				veracityAuthState: {
					someSecretState: true,
					message: "this should be persisted"
				}
			}
			const mockLoginResponsePost: any = {
				method: HTTPVerbs.post,
				body: {
					state: "abc123def456ghi789",
					id_token: mockIdToken.token
				}
			}
			const mockLoginResponseGet: any = {
				method: HTTPVerbs.get,
				query: {
					state: "abc123def456ghi789",
					id_token: mockIdToken.token
				}
			}
			it("creates a proper login url", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const nextResult = await instance.next()
				const state = instance["_currentContextState"]!.stateKey
				expect(nextResult).toEqual(`https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/oauth2/v2.0/authorize?p=B2C_1A_SignInWithADFSIdp&scope=openid%20offline_access&response_type=code%20id_token&response_mode=form_post&client_id=123123123123&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Floginreturn&state=${state}`)
			})
			it("returns false when request is B2C response and no more api scopes (form_post)", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginResponsePost,
					mockSettings,
					mockFullMetadata,
					mockCache,
					"prefix_"
				)
				validateVIDPToken.mockReturnValue({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				mockCache.get.mockReturnValueOnce({
					stateKey: "prefix_"+mockLoginResponsePost.state,
					query: mockLoginRequest.query,
					data: mockLoginRequest.veracityAuthState
				})
				const nextResult = await instance.next()
				expect(nextResult).toBe(false)
				expect(validateVIDPToken.mock.calls.length).toBe(1)
				expect(validateVIDPToken.mock.calls[0][0].token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!).toBeDefined()
				expect(instance.currentTokenData!.idToken.token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!.accessTokens).toEqual({})
			})
			it("returns false when request is B2C response and no more api scopes (query)", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginResponseGet,
					mockSettings,
					mockFullMetadata,
					mockCache,
					"prefix_"
				)
				validateVIDPToken.mockReturnValue({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				mockCache.get.mockReturnValueOnce({
					stateKey: "prefix_"+mockLoginResponsePost.state,
					query: mockLoginRequest.query,
					data: mockLoginRequest.veracityAuthState
				})
				const nextResult = await instance.next()
				expect(nextResult).toBe(false)
				expect(validateVIDPToken.mock.calls.length).toBe(1)
				expect(instance.currentTokenData).toBeDefined()
				expect(instance.currentTokenData!.idToken.token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!.accessTokens).toEqual({})
			})
		})
	})
	describe("multiple api scopes", () => {
		const mockSettings = {
			apiScopes: [
				"https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation",
				"https://dnvglb2cprod.onmicrosoft.com/93054ebf-1d7b-43f5-82ad-b2bde84d7b74/user_impersonation"
			],
			authParams: mockAuthParams,
			accessTokenParams: mockAccessTokenParams
		}
		describe("first login", () => {
			const mockRequest: any = {
				method: HTTPVerbs.get,
				query: {}
			}
			it("can be constructed", () => {
				let instance: VIDPOpenIDContext = undefined as any
				expect(() => {
					instance = new VIDPOpenIDContext(
						mockRequest,
						mockSettings,
						mockFullMetadata,
						mockCache
					)
				}).not.toThrow()
				expect(instance).toBeDefined()
				expect(instance.req).toBe(mockRequest)
				expect(instance.settings).toBe(mockSettings)
				expect(instance.metadata).toBe(mockFullMetadata)
			})
			it("returns expected context state", () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const contextState = instance["_contextState"]
				expect(contextState.data).toEqual({})
				expect(contextState.query).toEqual({})
				expect(typeof contextState.stateKey).toBe("string")
				expect(contextState.currentScope).not.toBeDefined()
				expect(contextState.accessTokens).not.toBeDefined()
				expect(contextState.idToken).not.toBeDefined()
			})
			it("returns undefined authResponseParams", () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				expect(instance["_authResponseParams"]).not.toBeDefined()
			})
			it("returns undefined authResponseError", () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				expect(instance["_authResponseError"]).not.toBeDefined()
			})
			it("returns first login url with proper params when calling next()", async () => {
				const instance = new VIDPOpenIDContext(
					mockRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const nextResult = await instance.next()
				const state = instance["_currentContextState"]!.stateKey
				expect(nextResult).toEqual(`https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/oauth2/v2.0/authorize?p=B2C_1A_SignInWithADFSIdp&scope=openid%20offline_access%20https%3A%2F%2Fdnvglb2cprod.onmicrosoft.com%2F83054ebf-1d7b-43f5-82ad-b2bde84d7b75%2Fuser_impersonation&response_type=code%20id_token&response_mode=form_post&client_id=123123123123&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Floginreturn&state=${state}`)
			})
		})
		describe("next()", () => {
			const mockLoginRequest: any = {
				method: HTTPVerbs.get,
				query: {}
			}
			const mockLoginResponse1Post: any = {
				method: HTTPVerbs.post,
				body: {
					state: "mockLoginResponse1Post",
					id_token: mockIdToken.token,
					code: "mockLoginResponse1PostCode"
				}
			}
			const mockLoginResponse1Get: any = {
				method: HTTPVerbs.post,
				body: {
					state: "mockLoginResponse1Get",
					id_token: mockIdToken.token,
					code: "mockLoginResponse1GetCode"
				}
			}
			const mockLoginResponse2Post: any = {
				method: HTTPVerbs.post,
				body: {
					state: "mockLoginResponse2Post",
					id_token: mockIdToken.token,
					code: "mockLoginResponse2PostCode"
				}
			}
			const mockLoginResponse2Get: any = {
				method: HTTPVerbs.post,
				body: {
					state: "mockLoginResponse2Get",
					id_token: mockIdToken.token,
					code: "mockLoginResponse2GetCode"
				}
			}
			it("creates a proper login url", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginRequest,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const nextResult = await instance.next()
				const state = instance["_currentContextState"]!.stateKey
				expect(nextResult).toEqual(`https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/oauth2/v2.0/authorize?p=B2C_1A_SignInWithADFSIdp&scope=openid%20offline_access%20https%3A%2F%2Fdnvglb2cprod.onmicrosoft.com%2F83054ebf-1d7b-43f5-82ad-b2bde84d7b75%2Fuser_impersonation&response_type=code%20id_token&response_mode=form_post&client_id=123123123123&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Floginreturn&state=${state}`)
			})
			it("negotiates tokens for the first response (form_post)", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginResponse1Post,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				mockCache.get.mockReturnValueOnce({
					stateKey: "prefix_"+mockLoginResponse1Post.body.state,
					currentScope: mockSettings.apiScopes![0],
					query: mockLoginRequest.query,
					data: mockLoginRequest.veracityAuthState
				})

				const scopes = mockSettings.apiScopes!
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockAccessToken.accessToken,
					tokenDecoded: mockAccessToken.accessTokenDecoded
				})
				validateVIDPAuthorizationCode.mockReturnValue(true)
				requestVIDPAccessToken.mockReturnValueOnce({
					access_token: mockAccessToken.accessToken,
					token_type: "Bearer",
					expires_in: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.iat,
					scope: `openid offline_access ${mockSettings.apiScopes[0]}`,
					refresh_token: "refreshToken",
					id_token: mockIdToken.token
				})

				const nextResult = await instance.next()
				const state = instance["_currentContextState"]!.stateKey
				expect(nextResult).toEqual(`https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/oauth2/v2.0/authorize?p=B2C_1A_SignInWithADFSIdp&scope=openid%20offline_access%20https%3A%2F%2Fdnvglb2cprod.onmicrosoft.com%2F93054ebf-1d7b-43f5-82ad-b2bde84d7b74%2Fuser_impersonation&response_type=code%20id_token&response_mode=form_post&client_id=123123123123&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Floginreturn&state=${state}`)
				expect(validateVIDPToken.mock.calls.length).toBe(3) // 1: auth response id token, 2: AT response id token, 3: AT response access token
				expect(validateVIDPAuthorizationCode.mock.calls.length).toBe(1)
				expect(requestVIDPAccessToken.mock.calls.length).toBe(1)
				expect(instance.currentTokenData).toBeDefined()
				expect(instance.currentTokenData!.idToken.token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!.accessTokens).toEqual({
					[scopes[0]]: {
						scope: scopes[0],
						token: mockAccessToken.accessToken,
						header: mockAccessToken.accessTokenDecoded.header,
						payload: mockAccessToken.accessTokenDecoded.payload,
						issued: mockAccessToken.accessTokenDecoded.payload.iat,
						lifetime: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.nbf,
						expires: mockAccessToken.accessTokenDecoded.payload.exp,
						refreshToken: "refreshToken"
					}
				})
			})
			it("negotiates tokens for the first response (query)", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginResponse1Get,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				mockCache.get.mockReturnValueOnce({
					stateKey: "prefix_"+mockLoginResponse1Get.body.state,
					currentScope: mockSettings.apiScopes![0],
					query: mockLoginRequest.query,
					data: mockLoginRequest.veracityAuthState
				})

				const scopes = mockSettings.apiScopes!
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockAccessToken.accessToken,
					tokenDecoded: mockAccessToken.accessTokenDecoded
				})
				validateVIDPAuthorizationCode.mockReturnValue(true)
				requestVIDPAccessToken.mockReturnValueOnce({
					access_token: mockAccessToken.accessToken,
					token_type: "Bearer",
					expires_in: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.iat,
					scope: `openid offline_access ${mockSettings.apiScopes[0]}`,
					refresh_token: "refreshToken",
					id_token: mockIdToken.token
				})

				const nextResult = await instance.next()
				const state = instance["_currentContextState"]!.stateKey
				expect(nextResult).toEqual(`https://login.microsoftonline.com/a68572e3-63ce-4bc1-acdc-b64943502e9d/oauth2/v2.0/authorize?p=B2C_1A_SignInWithADFSIdp&scope=openid%20offline_access%20https%3A%2F%2Fdnvglb2cprod.onmicrosoft.com%2F93054ebf-1d7b-43f5-82ad-b2bde84d7b74%2Fuser_impersonation&response_type=code%20id_token&response_mode=form_post&client_id=123123123123&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Foidc%2Floginreturn&state=${state}`)
				expect(validateVIDPToken.mock.calls.length).toBe(3) // 1: auth response id token, 2: AT response id token, 3: AT response access token
				expect(validateVIDPAuthorizationCode.mock.calls.length).toBe(1)
				expect(requestVIDPAccessToken.mock.calls.length).toBe(1)
				expect(instance.currentTokenData).toBeDefined()
				expect(instance.currentTokenData!.idToken.token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!.accessTokens).toEqual({
					[scopes[0]]: {
						scope: scopes[0],
						token: mockAccessToken.accessToken,
						header: mockAccessToken.accessTokenDecoded.header,
						payload: mockAccessToken.accessTokenDecoded.payload,
						issued: mockAccessToken.accessTokenDecoded.payload.iat,
						lifetime: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.nbf,
						expires: mockAccessToken.accessTokenDecoded.payload.exp,
						refreshToken: "refreshToken"
					}
				})
			})
			it("negotiates tokens for the second response (form_post)", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginResponse2Post,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const mockContextState = {
					stateKey: "prefix_"+mockLoginResponse1Post.body.state,
					currentScope: mockSettings.apiScopes[1],
					query: mockLoginRequest.query,
					data: mockLoginRequest.veracityAuthState,

					idToken: {
						token: mockIdToken.token,
						header: mockIdToken.idTokenDecoded.header,
						payload: mockIdToken.idTokenDecoded.payload,
						issued: mockIdToken.idTokenDecoded.payload.iat,
						expires: mockIdToken.idTokenDecoded.payload.exp,
						lifetime: mockIdToken.idTokenDecoded.payload.exp - mockIdToken.idTokenDecoded.payload.iat
					},
					accessTokens: {
						[mockSettings.apiScopes[0]]: {
							scope: mockSettings.apiScopes[0],
							token: mockAccessToken.accessToken,
							header: mockAccessToken.accessTokenDecoded.header,
							payload: mockAccessToken.accessTokenDecoded.payload,
							issued: mockAccessToken.accessTokenDecoded.payload.iat,
							expires: mockAccessToken.accessTokenDecoded.payload.exp,
							lifetime: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.iat,
							refreshToken: "refreshToken"
						}
					}
				}
				mockCache.get.mockReturnValueOnce(mockContextState)

				const scopes = mockSettings.apiScopes!
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockAccessToken.accessToken,
					tokenDecoded: mockAccessToken.accessTokenDecoded
				})
				validateVIDPAuthorizationCode.mockReturnValue(true)
				requestVIDPAccessToken.mockReturnValueOnce({
					access_token: mockAccessToken.accessToken,
					token_type: "Bearer",
					expires_in: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.iat,
					scope: `openid offline_access ${mockSettings.apiScopes[1]}`,
					refresh_token: "refreshToken",
					id_token: mockIdToken.token
				})

				const nextResult = await instance.next()
				expect(nextResult).toEqual(false)
				expect(validateVIDPToken.mock.calls.length).toBe(3) // 1: auth response id token, 2: AT response id token, 3: AT response access token
				expect(validateVIDPAuthorizationCode.mock.calls.length).toBe(1)
				expect(requestVIDPAccessToken.mock.calls.length).toBe(1)
				expect(instance.currentTokenData).toBeDefined()
				expect(instance.currentTokenData!.idToken.token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!.accessTokens).toEqual({
					...mockContextState.accessTokens,
					[scopes[1]]: {
						scope: scopes[1],
						token: mockAccessToken.accessToken,
						header: mockAccessToken.accessTokenDecoded.header,
						payload: mockAccessToken.accessTokenDecoded.payload,
						issued: mockAccessToken.accessTokenDecoded.payload.iat,
						lifetime: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.nbf,
						expires: mockAccessToken.accessTokenDecoded.payload.exp,
						refreshToken: "refreshToken"
					}
				})
			})
			it("negotiates tokens for the second response (query)", async () => {
				const instance = new VIDPOpenIDContext(
					mockLoginResponse2Get,
					mockSettings,
					mockFullMetadata,
					mockCache
				)
				const mockContextState = {
					stateKey: "prefix_"+mockLoginResponse2Get.body.state,
					currentScope: mockSettings.apiScopes[1],
					query: mockLoginRequest.query,
					data: mockLoginRequest.veracityAuthState,

					idToken: {
						token: mockIdToken.token,
						header: mockIdToken.idTokenDecoded.header,
						payload: mockIdToken.idTokenDecoded.payload,
						issued: mockIdToken.idTokenDecoded.payload.iat,
						expires: mockIdToken.idTokenDecoded.payload.exp,
						lifetime: mockIdToken.idTokenDecoded.payload.exp - mockIdToken.idTokenDecoded.payload.iat
					},
					accessTokens: {
						[mockSettings.apiScopes[0]]: {
							scope: mockSettings.apiScopes[0],
							token: mockAccessToken.accessToken,
							header: mockAccessToken.accessTokenDecoded.header,
							payload: mockAccessToken.accessTokenDecoded.payload,
							issued: mockAccessToken.accessTokenDecoded.payload.iat,
							expires: mockAccessToken.accessTokenDecoded.payload.exp,
							lifetime: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.iat,
							refreshToken: "refreshToken"
						}
					}
				}
				mockCache.get.mockReturnValueOnce(mockContextState)

				const scopes = mockSettings.apiScopes!
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockIdToken.token,
					tokenDecoded: mockIdToken.idTokenDecoded
				})
				validateVIDPToken.mockReturnValueOnce({
					token: mockAccessToken.accessToken,
					tokenDecoded: mockAccessToken.accessTokenDecoded
				})
				validateVIDPAuthorizationCode.mockReturnValue(true)
				requestVIDPAccessToken.mockReturnValueOnce({
					access_token: mockAccessToken.accessToken,
					token_type: "Bearer",
					expires_in: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.iat,
					scope: `openid offline_access ${mockSettings.apiScopes[1]}`,
					refresh_token: "refreshToken",
					id_token: mockIdToken.token
				})

				const nextResult = await instance.next()
				expect(nextResult).toEqual(false)
				expect(validateVIDPToken.mock.calls.length).toBe(3) // 1: auth response id token, 2: AT response id token, 3: AT response access token
				expect(validateVIDPAuthorizationCode.mock.calls.length).toBe(1)
				expect(requestVIDPAccessToken.mock.calls.length).toBe(1)
				expect(instance.currentTokenData).toBeDefined()
				expect(instance.currentTokenData!.idToken.token).toEqual(mockIdToken.token)
				expect(instance.currentTokenData!.accessTokens).toEqual({
					...mockContextState.accessTokens,
					[scopes[1]]: {
						scope: scopes[1],
						token: mockAccessToken.accessToken,
						header: mockAccessToken.accessTokenDecoded.header,
						payload: mockAccessToken.accessTokenDecoded.payload,
						issued: mockAccessToken.accessTokenDecoded.payload.iat,
						lifetime: mockAccessToken.accessTokenDecoded.payload.exp - mockAccessToken.accessTokenDecoded.payload.nbf,
						expires: mockAccessToken.accessTokenDecoded.payload.exp,
						refreshToken: "refreshToken"
					}
				})
			})
		})
	})
})
