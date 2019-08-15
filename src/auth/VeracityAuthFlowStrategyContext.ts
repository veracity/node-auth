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
	IVeracityAuthFlowSessionData,
	IVeracityAuthFlowStrategySettings,
	IVeracityAuthMetadataWithJWKs
} from "../interfaces"
import { createUid, getVeracityAuthMetadata, SessionWrapper } from "../utils"
import { combineParams, encodeURIParams } from "../utils/uriParams"
import { B2CError } from "./B2CError"

const getMetadata = (() => {
	let metadataStore: {
		metadata?: IVeracityAuthMetadataWithJWKs
		keepUntil?: number
	} = {}

	const invalidateMetadata = () => {
		if (!metadataStore.metadata) return
		if (!metadataStore.keepUntil) return

		if (Date.now() > metadataStore.keepUntil) {
			metadataStore = {}
		}
	}

	return async (parameters: Pick<IVeracityAuthFlowStrategySettings, "tenantId" | "policy" | "configuration">) => {
		invalidateMetadata()
		if (metadataStore.metadata) {
			return metadataStore.metadata
		}

		const metadata = await getVeracityAuthMetadata(parameters)
		if (parameters.configuration && parameters.configuration.keepMetadataFor) {
			metadataStore = {
				metadata,
				keepUntil: Date.now() + (parameters.configuration.keepMetadataFor * 1000)
			}
		}

		return metadata
	}
})()

/**
 * Helper class for managing the current authentication context.
 * Enables support for negotiating multiple tokens within a single login request.
 */
export class VeracityAuthFlowStrategyContext {
	public get nonce() {
		if (this.session.data && this.session.data.nonce) {
			return this.session.data.nonce
		}
		return this._nonce
	}
	public get state() {
		if (this.session.data && this.session.data.state) {
			return this.session.data.state
		}
		return this._state
	}

	/**
	 * Returns the last resolved id token.
	 */
	public get idToken() {
		if (!this.session.data || !this.session.data.lastIdTokenDecoded) {
			return undefined
		}
		return this.session.data.lastIdTokenDecoded.payload
	}
	/**
	 * Returns a list of all api scopes that have stored access tokens
	 */
	public get readyTokens() {
		return this.session.data.tokens || []
	}
	/**
	 * Returns the next api scope that should be logged in or undefined if all scopes are logged in.
	 */
	public get nextAPIScope() {
		const readyApiScopes = Object.keys(this.readyTokens)
		return (this.strategySettings.apiScopes || []).find((scopeToProcess) => {
			return readyApiScopes.indexOf(scopeToProcess) < 0
		})
	}
	/**
	 * Checks whether we still have some more api scopes that have not negotiated for their tokens.
	 */
	public get hasMoreAPIScopes() {
		return !!this.nextAPIScope
	}

	/**
	 * Returns all parameters needed to redirect the user to a B2C for login.
	 * The parameters will remain the same for the lifetime of this instance.
	 */
	public get loginParams(): IB2CLoginRequestParamaters {
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
	public get accessTokenParams(): IB2CAccessTokenRequestParameters {
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
	public get isB2CLoginResponse() {
		if (this.req.method !== "POST") return false
		if (typeof this.req.body !== "object") return false
		return isB2CLoginResponse(this.req.body)
	}
	/**
	 * Determines if the current request is a failure response from B2C of any kind.
	 */
	public get isB2CFailureResponse() {
		if (this.req.method !== "POST") return false
		if (!this.req.body) return false
		return isB2CResponseFailure(this.req.body)
	}
	public get reqBodyLoginResponse() {
		return this.req.body as IB2CLoginResponseSuccess
	}
	public get reqBodyAccessCodeResponse() {
		return this.req.body as IB2CAuthorizationCodeExchangeResponseSuccess
	}
	public get reqBodyFailureResponse() {
		return this.req.body as IB2CAuthorizationCodeExchangeResponseFailure | IB2CLoginResponseFailure
	}
	public session: SessionWrapper<IVeracityAuthFlowSessionData>
	private _nonce = createUid()
	private _state = createUid()

	public constructor(
		private req: Request,
		private strategySettings: IVeracityAuthFlowStrategySettings
	) {
		this.session = new SessionWrapper<IVeracityAuthFlowSessionData>("authflow", req)
	}

	/**
	 * Returns metadata from session if possible or from endpoint
	 */
	public async getClosestMetadata() {
		if (this.session.data.metadata) {
			return this.session.data.metadata
		}

		const metadata = await getMetadata(this.strategySettings)
		return metadata // Direct return await does not always compile to code that throws errors correclty.
	}

	/**
	 * This is the magic method that causes the entire login process to proceeed correctly.
	 * If called on the initial login request:
	 *   Sets up session state
	 *   Returns the full url to redirect the user to in order to log them in.
	 *
	 * If called on the users return from logging in:
	 *   Validates the id token and authorization code
	 *   Exchanges the authorization code for an access token and optional refresh token
	 *   Validates the access token
	 *   Stores data in session and tokens under proper api scope name
	 *   If there are more api scopes logs in with new scope
	 *   Else returns false to indicate the login flow is completed
	 *
	 * If any error occurs it will throw exceptions. Calling code should deal with them.¨
	 * @returns url to redirect the user to in order to log them in or false if no more logins are required.
	 */
	public async next(): Promise<string | false> {
		if (this.isB2CFailureResponse) {
			throw new B2CError(this.reqBodyFailureResponse)
		}

		if (this.isB2CLoginResponse) {
			this.verifyLoginResponse()
			return false
		}

		return this.beginLogin()
	}
	/**
	 * Clears any temporary session information used during authentication
	 */
	public cleanUp() {
		this.session.clear()
	}

	/**
	 * Initialize parameters and session and returns the the url to redirect the user to with all parameters
	 */
	private async beginLogin() {
		const metadata = await this.getClosestMetadata()
		const params = this.loginParams
		this.session.data = {
			...this.session.data,
			state: params.state,
			nonce: params.nonce,
			metadata
		}

		const loginUrl = metadata.authorization_endpoint +
			(metadata.authorization_endpoint.indexOf("?") >= 0 ? "&" : "?") +
			combineParams(encodeURIParams(params)).join("&")
		return loginUrl
	}

	private verifyLoginResponse() {

	}
}
