import { VIDPError, VIDPErrorSources, VIDPStrategyErrorCodes } from "../errors"
import { IVIDPAccessToken, IVIDPAccessTokenData, IVIDPIDToken, IVIDPIDTokenData, IVIDPTokenData } from "../interfaces"
import {
	IVIDPAuthResponseFailure,
	IVIDPAuthResponseSuccess,
	IVIDPMetadatWithJWKs
} from "../internalInterfaces/VIDPReqRes"
import { createUid } from "../utils/createUid"
import { IMemCache } from "../utils/MemCache"
import {
	createVIDPAuthorizationUrl,
	DEFAULT_VIDP_AUTHORIZATION_URL_PARAMS,
	ICreateVIDPAuthorizationUrlParams
} from "./createVIDPAuthorizationUrl"
import { parseVIDPAccessToken, parseVIDPToken } from "./parseVIDPToken"
import { DEFAULT_REQUEST_VIDP_ACCESS_TOKEN_PARAMS, IRequestVIDPAccessTokenParams, requestVIDPAccessToken } from "./requestVIDPAccessToken"
import { validateVIDPAuthorizationCode, validateVIDPToken } from "./tokenValidators"

/**
 * Incomming request from the user or the IDP. Maps to an express request, but does not have to be.
 */
export interface IRequestLike {
	method: string
	query: {[key: string]: any}
	body?: any
	veracityAuthState?: {[key: string]: any}
}

export interface IVIDPOpenIDSettings {
	apiScopes?: string[]
	authParams: Omit<ICreateVIDPAuthorizationUrlParams, "authorizationURL">
	accessTokenParams: Omit<IRequestVIDPAccessTokenParams, "code" | "tokenURL">
}

export interface IOpenIDCLoginContextState {
	stateKey: string
	query: {[key: string]: string}
	data: {[key: string]: any}

	/**
	 * If not defined means there is either no api scopes or authentication has not begun.
	 */
	currentScope?: string
	idToken?: IVIDPIDTokenData
	accessTokens?: {[apiScope: string]: IVIDPAccessTokenData}
}

/**
 * This class manages a login sequence where 0 or more access tokens are needed to be acquired.
 * It can be used both for web and native applications.
 * It keeps an internal cache of the login state for a user using the provided memCache instance.
 * There is no dependency on session at all.
 */
export class VIDPOpenIDContext {
	private _currentContextState?: IOpenIDCLoginContextState

	public constructor(
		public req: IRequestLike,
		public settings: IVIDPOpenIDSettings,
		public metadata: IVIDPMetadatWithJWKs,
		public memCache: IMemCache,
		public memCacheKeyPrefix: string = "vidpOpenIDContext_"
	) { }

	/**
	 * Extracts the auth response from the incomming request from B2C if this is such a request.
	 */
	private get _authResponseParams(): IVIDPAuthResponseSuccess | undefined {
		const {method, body = {}, query = {}} = this.req
		if (method === "POST" && body.id_token) {
			return body as IVIDPAuthResponseSuccess
		}
		if (method === "GET" && query.id_token) {
			return query as IVIDPAuthResponseSuccess
		}
		return undefined
	}
	/**
	 * Extracts the auth error response from the incomming request from B2C if this is such a request.
	 */
	private get _authResponseError(): IVIDPAuthResponseFailure | undefined {
		const {method, body = {}, query = {}} = this.req
		if (method === "POST" && body.error) {
			return body as IVIDPAuthResponseFailure
		}
		if (method === "GET" && query.error) {
			return query as IVIDPAuthResponseFailure
		}
		return undefined
	}

	/**
	 * Returns the current context state or a new one if none should exist.
	 * Once a new context state is created another call to this getter will NOT recreate it.
	 * If a context state should exist, but cannot be found it will throw a VIDPError.
	 */
	private get _contextState() {
		if (this._currentContextState) {
			return this._currentContextState
		}

		const authResponse = this._authResponseParams
		if (authResponse) {
			const stateKey = this.memCacheKeyPrefix+authResponse.state
			this._currentContextState = this.memCache.get<IOpenIDCLoginContextState>(stateKey)
			if (!this._currentContextState) {
				throw new VIDPError(
					VIDPStrategyErrorCodes.invalid_internal_state,
					"The authorization response did not return a valid state parameter.",
					VIDPErrorSources.authCodeRequest,
					this._authResponseParams
				)
			}
			return this._currentContextState
		}

		// There is no previous state so we must create a new one
		this._currentContextState = {
			stateKey: createUid(),
			query: this.req.query,
			data: this.req.veracityAuthState || {}
		}
		return this._currentContextState
	}
	/**
	 * Get all currently accumulated authentication data.
	 */
	public get currentTokenData(): IVIDPTokenData & {query: any, data?: any} | undefined {
		const { idToken, accessTokens = {}, query = {}, data } = this._contextState
		if (!idToken) return undefined
		return {
			idToken,
			accessTokens,
			query,
			data
		}
	}

	/**
	 * Call next to proceed to the next step in the login flow. This will either return the next url you need
	 * to redirect the user to or false to indicate the flow is complete and that all available token information
	 * is available in the currentTokenData object.
	 */
	public async next() {
		this._throwIfAuthResponseError()

		try {
			const authResponse = this._authResponseParams
			let contextState = this._contextState
			const nextScope = this._getNextAPIScope(contextState)
			if (authResponse) {
				let tokenData = this._validateAuthResponse()
				if (contextState.currentScope && authResponse.code) {
					tokenData = await this._getAndValidateAccessToken()
				}
				contextState = this._addTokenDataToContextState(tokenData)
				if (!nextScope) {
					return false
				}
			}
			if (nextScope) {
				contextState = {
					...contextState,
					currentScope: nextScope
				}
			}

			this.memCache.set(this.memCacheKeyPrefix+contextState.stateKey, contextState)
			return createVIDPAuthorizationUrl(this._getAuthParams(nextScope))
		} catch (error) {
			if (error instanceof VIDPError) {
				throw error
			}
			const vidpError = new VIDPError(
				VIDPStrategyErrorCodes.unknown_error,
				error.message,
				VIDPErrorSources.other,
				{},
				error
			)
			vidpError.stack = error.stack
			throw vidpError
		}
	}

	private _addTokenDataToContextState(tokenData: IVIDPTokenData) {
		const oldContextState = this._contextState
		this.memCache.remove(oldContextState.stateKey)
		this._currentContextState = undefined
		return this._currentContextState = {
			...oldContextState,
			stateKey: createUid(),
			idToken: tokenData.idToken,
			accessTokens: {
				...(oldContextState.accessTokens || {}),
				...tokenData.accessTokens
			}
		}
	}

	private _validateAuthResponse(): IVIDPTokenData {
		const { id_token, code } = this._authResponseParams!
		const contextState = this._contextState
		const {issuer, jwks} = this.metadata

		const {token, tokenDecoded} = validateVIDPToken<IVIDPIDToken>({
			audience: this.settings.authParams.client_id,
			token: id_token,
			issuer,
			jwks
		})

		if (code && tokenDecoded.payload.c_hash) {
			validateVIDPAuthorizationCode(code, tokenDecoded.payload.c_hash)
		}

		return {
			idToken: parseVIDPToken(token, tokenDecoded),
			accessTokens: contextState.accessTokens || {}
		}
	}
	private async _getAndValidateAccessToken(): Promise<IVIDPTokenData> {
		const authResponse = this._authResponseParams!
		const contextState = this._contextState
		const accessTokenParams: IRequestVIDPAccessTokenParams = {
			tokenURL: this.metadata.token_endpoint,
			...DEFAULT_REQUEST_VIDP_ACCESS_TOKEN_PARAMS,
			...this.settings.accessTokenParams,
			code: authResponse.code!,
			scope: `${DEFAULT_REQUEST_VIDP_ACCESS_TOKEN_PARAMS.scope} ${contextState.currentScope!}`
		}

		const { issuer, jwks } = this.metadata
		const accessTokenResponse = await requestVIDPAccessToken(accessTokenParams)

		const {token: idToken, tokenDecoded: idTokenDecoded} = validateVIDPToken<IVIDPIDToken>({
			audience: this.settings.accessTokenParams.client_id,
			issuer,
			jwks,
			token: accessTokenResponse.id_token
		})
		const {token: accessToken, tokenDecoded: accessTokenDecoded} = validateVIDPToken<IVIDPAccessToken>({
			issuer,
			jwks,
			hash: idTokenDecoded.payload.at_hash,
			token: accessTokenResponse.access_token
		})
		const accessTokenData = parseVIDPAccessToken(accessToken, accessTokenDecoded, contextState.currentScope!)
		if (accessTokenResponse.refresh_token) {
			accessTokenData.refreshToken = accessTokenResponse.refresh_token
		}

		return {
			idToken: parseVIDPToken(idToken, idTokenDecoded),
			accessTokens: {
				[contextState.currentScope!]: accessTokenData
			}
		}
	}

	private _getNextAPIScope(contextState: IOpenIDCLoginContextState) {
		if (!this.settings.apiScopes || this.settings.apiScopes.length === 0) {
			return undefined
		}

		if (!contextState || !contextState.currentScope) {
			return this.settings.apiScopes[0]
		}

		const currentScope = contextState.currentScope!
		const nextIdx = this.settings.apiScopes.indexOf(currentScope) + 1
		if (nextIdx >= this.settings.apiScopes.length) {
			return undefined
		}
		return this.settings.apiScopes[nextIdx]
	}
	private _getAuthParams(apiScope?: string): ICreateVIDPAuthorizationUrlParams {
		const params: ICreateVIDPAuthorizationUrlParams = {
			authorizationURL: this.metadata.authorization_endpoint,
			...DEFAULT_VIDP_AUTHORIZATION_URL_PARAMS,
			...this.settings.authParams,
			state: this._contextState.stateKey
		}

		if (!apiScope) return params
		params.scope = `${params.scope} ${apiScope}`
		return params
	}

	private _throwIfAuthResponseError() {
		const errorResponse = this._authResponseError
		if (errorResponse) {
			throw new VIDPError(
				errorResponse.error,
				errorResponse.error_description,
				VIDPErrorSources.authCodeRequest,
				errorResponse
			)
		}
	}
}
