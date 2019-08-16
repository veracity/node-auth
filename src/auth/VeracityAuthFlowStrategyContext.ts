import { Request } from "express"
import {
	IB2CAccessTokenRequestParameters,
	IB2CAuthorizationCodeExchangeResponseFailure,
	IB2CAuthorizationCodeExchangeResponseSuccess,
	IB2CLoginRequestParamaters,
	IB2CLoginResponseFailure,
	IB2CLoginResponseSuccess,
	isB2CLoginResponse,
	isB2CResponseFailure,
	IVeracityAccessToken,
	IVeracityAuthFlowSessionData,
	IVeracityAuthFlowStrategySettings,
	IVeracityIDToken,
	IVeracityIDTokenPayload,
	IVeracityTokenData
} from "../interfaces"
import {
	createUid,
	getCachedVeracityAuthMetadata,
	IValidationOptions,
	request,
	SessionWrapper,
	validateIDTokenAndAccessToken,
	validateIDTokenAndAuthorizationCode
} from "../utils"
import { combineParams, encodeURIParams } from "../utils/uriParams"
import { B2CError } from "./B2CError"

/**
 * Helper class for managing the current authentication context.
 * Enables support for negotiating multiple tokens within a single login request.
 */
export class VeracityAuthFlowStrategyContext {
	private get nonce() {
		if (this.session.data && this.session.data.nonce) {
			return this.session.data.nonce
		}
		return this._nonce
	}
	private get state() {
		if (this.session.data && this.session.data.state) {
			return this.session.data.state
		}
		return this._state
	}

	/**
	 * Returns the last resolved id token.
	 */
	public get idToken() {
		return this._idToken
	}
	/**
	 * Returns an object keyed by api scope that contains all ready access tokens and related information.
	 */
	public get readyTokens() {
		return this.session.data.tokens || this._tokenData
	}
	/**
	 * Returns the scope that is currently being authenticated or if this is called before authrization code
	 * is returned it returns the next API scope.
	 */
	private get currentAPIScope() {
		return this.session.data && this.session.data.apiScope ? this.session.data.apiScope : this.nextAPIScope
	}
	/**
	 * Returns the next api scope that should be logged in or undefined if all scopes are logged in.
	 */
	private get nextAPIScope() {
		const readyApiScopes = Object.keys(this.readyTokens || {})
		return (this.strategySettings.apiScopes || []).find((scopeToProcess) => {
			return readyApiScopes.indexOf(scopeToProcess) < 0
		})
	}

	/**
	 * Returns all parameters needed to redirect the user to a B2C for login.
	 * The parameters will remain the same for the lifetime of this instance.
	 */
	private get loginParams(): IB2CLoginRequestParamaters {
		const scopes = ["openid"]
		if (this.strategySettings.requestRefreshTokens) {
			scopes.push("offline_access")
		}
		scopes.push(this.nextAPIScope || "")
		return {
			client_id: this.strategySettings.clientId,
			redirect_uri: this.strategySettings.redirectUri,
			response_type: "code id_token",
			response_mode: "form_post",
			scope: scopes.join(" "),
			state: this.state,
			nonce: this.nonce
		}
	}
	/**
	 * Returns all parameters needed to perform an authorization code exchange for an access token.
	 * The parameters will remain the same for the lifetime of this instance.
	 */
	private get accessTokenParams(): IB2CAccessTokenRequestParameters {
		if (!this.isB2CLoginResponse) {
			throw new Error("This request does not appear to be a login response from B2C. Cannot construct accessTokenParams")
		}

		const scopes = ["openid"]
		if (this.strategySettings.requestRefreshTokens) {
			scopes.push("offline_access")
		}
		scopes.push(this.nextAPIScope || "")
		return {
			client_id: this.strategySettings.clientId,
			client_secret: this.strategySettings.clientSecret,
			code: this.reqBodyLoginResponse.code,
			grant_type: "authorization_code",
			redirect_uri: this.strategySettings.redirectUri,
			scope: scopes.join(" ")
		}
	}

	/**
	 * Determines if the current request is a user returning from a login at B2C or a federated service.
	 */
	private get isB2CLoginResponse() {
		if (this.req.method !== "POST") return false
		if (typeof this.req.body !== "object") return false
		return isB2CLoginResponse(this.req.body)
	}
	/**
	 * Determines if the current request is a failure response from B2C of any kind.
	 */
	private get isB2CFailureResponse() {
		if (this.req.method !== "POST") return false
		if (!this.req.body) return false
		return isB2CResponseFailure(this.req.body)
	}
	private get reqBodyLoginResponse() {
		return this.req.body as IB2CLoginResponseSuccess
	}
	private get reqBodyFailureResponse() {
		return this.req.body as IB2CAuthorizationCodeExchangeResponseFailure | IB2CLoginResponseFailure
	}
	private session: SessionWrapper<IVeracityAuthFlowSessionData>

	private _nonce = createUid()
	private _state = createUid()
	private _idToken?: IVeracityIDTokenPayload
	private _tokenData?: {[scope: string]: IVeracityTokenData}

	public constructor(
		private req: Request,
		private strategySettings: IVeracityAuthFlowStrategySettings
	) {
		this.session = new SessionWrapper<IVeracityAuthFlowSessionData>("authflow", req)
	}

	/**
	 * This is the magic method that causes the entire login process to proceeed correctly.
	 * If called on the initial login request:
	 *   Sets up session state,
	 *   Returns the full url to redirect the user to in order to log them in.
	 *
	 * If called on the users return from logging in:
	 *   Validates the id token and authorization code,
	 *   Exchanges the authorization code for an access token and optional refresh token,
	 *   Validates the access token,
	 *   Stores data in session and tokens under proper api scope name,
	 *   If there are more api scopes logs in with new scope,
	 *   Else returns false to indicate the login flow is completed,
	 *
	 * If any error occurs it will throw exceptions. Calling code should deal with them.
	 * @returns url to redirect the user to in order to log them in or false if no more logins are required.
	 */
	public async next(): Promise<string | false> {
		try {
			if (this.isB2CFailureResponse) {
				throw new B2CError(this.reqBodyFailureResponse)
			}

			if (this.isB2CLoginResponse) {
				const loginResult = await this.processLoginResponse()
				if (!loginResult) { // Means there are no more logins to perform
					this.cleanUp()
					return false
				}

				return loginResult
			}

			return this.beginLogin() // Continue with next login
		} catch (error) {
			this.cleanUp()
			throw error
		}
	}
	/**
	 * Clears any temporary session information used during authentication
	 */
	public cleanUp() {
		this.session.destroyNamespace()
	}

	/**
	 * Returns metadata from session if possible or from endpoint
	 */
	private async getClosestMetadata() {
		if (this.session.data.metadata) {
			return this.session.data.metadata
		}

		const metadata = await getCachedVeracityAuthMetadata(this.strategySettings)
		return metadata // Direct return await does not always compile to code that throws errors correclty.
	}
	/**
	 * Returns a complete validation options object that can be used for validating authorization codes
	 * or access tokens.
	 * @param idToken
	 */
	private async getValidationOptions(idToken: string): Promise<IValidationOptions> {
		const meta = await this.getClosestMetadata()

		return {
			clientId: this.strategySettings.clientId,
			issuer: meta.issuer,
			nonce: this.nonce,
			jwks: meta.jwks,
			idToken
		}
	}

	private regenerateNonce() {
		this._nonce = createUid()
	}
	private regenerateState() {
		this._state = createUid()
	}
	private async validateLoginResponse() {
		const { code, id_token, state } = this.reqBodyLoginResponse
		if (state !== this.state) {
			throw new Error("State returned from B2C differs from state that was sent. Request may have been tampered with.")
		}

		const validationOptions = await this.getValidationOptions(id_token)
		return validateIDTokenAndAuthorizationCode(code, validationOptions)
	}
	private async exchangeAuthCodeForAccessToken() {
		const metadata = await this.getClosestMetadata()
		const form = this.accessTokenParams
		const accessTokenRawResponse = await request(metadata.token_endpoint, {
			method: "POST",
			form
		})
		return JSON.parse(accessTokenRawResponse) as IB2CAuthorizationCodeExchangeResponseSuccess
	}
	private async validateAccessToken(idToken: string, accessToken: string) {
		const validationOptions = await this.getValidationOptions(idToken)
		return validateIDTokenAndAccessToken(accessToken, validationOptions)
	}

	/**
	 * Initializes state and sets up parameters for the first or any subsequent logins.
	 */
	private async beginLogin() {
		this.regenerateNonce()
		this.regenerateState()

		const metadata = await this.getClosestMetadata()
		const params = this.loginParams
		this.session.data = {
			...this.session.data,
			apiScope: this.nextAPIScope,
			state: params.state,
			nonce: params.nonce,
			metadata
		}

		const loginUrl = metadata.authorization_endpoint +
			(metadata.authorization_endpoint.indexOf("?") >= 0 ? "&" : "?") +
			combineParams(encodeURIParams(params)).join("&")
		return loginUrl
	}
	/**
	 * Validates the returned id token and authorization code.
	 *
	 * Exchanges authorization code for access token and optional refresh token.
	 *
	 * Validates access token and stores data in session.
	 */
	private async processLoginResponse() {
		const validLoginIDToken = await this.validateLoginResponse()
		if (!this.currentAPIScope) {
			this._idToken = validLoginIDToken.payload
			return false
		}

		const accessTokenResponse = await this.exchangeAuthCodeForAccessToken()
		const { id_token, access_token } = accessTokenResponse
		const validAccessToken = await this.validateAccessToken(id_token, access_token)
		const allTokenData = {
			...accessTokenResponse,
			...validAccessToken
		}

		this._tokenData = {
			...(this.session.data.tokens || {}),
			...this.constructTokenData(this.currentAPIScope, allTokenData)
		}
		this.session.data = {
			...this.session.data,
			tokens: this._tokenData
		}

		if (this.nextAPIScope) {
			return this.beginLogin()
		}
		return false
	}

	private constructTokenData(apiScope: string, data: IB2CAuthorizationCodeExchangeResponseSuccess & {
		idToken: string
		idTokenDecoded: IVeracityIDToken
		accessToken: string
		accessTokenDecoded: IVeracityAccessToken
	}): {[scope: string]: IVeracityTokenData} {
		const tokenData: IVeracityTokenData = {
			idToken: data.idToken,
			idTokenDecoded: data.idTokenDecoded.payload,
			accessToken: data.accessToken,
			accessTokenDecoded: data.accessTokenDecoded.payload,
			accessTokenExpires: data.accessTokenDecoded.payload.exp,
			accessTokenLifetime: parseInt(data.expires_in, 10),
			scope: apiScope
		}

		if (data.refresh_token) {
			tokenData.refreshToken = data.refresh_token
			tokenData.refreshTokenExpires = data.refresh_token_expires_in ?
				parseInt(data.refresh_token_expires_in, 10) : undefined
		}

		return {
			[apiScope]: tokenData
		}
	}
}
