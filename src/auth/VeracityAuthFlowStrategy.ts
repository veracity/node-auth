import { NextFunction, Request, Response } from "express-serve-static-core"
import { Strategy, StrategyCreatedStatic } from "passport"
import { IVeracityAuthFlowStrategySettings } from "../interfaces/IVeracityAuthFlowStrategySettings"
import { VerifierFunction } from "../interfaces/IVeracityAuthFlowStrategyVerifierOptions"
import { IVeracityTokenData } from "../interfaces/IVeracityTokenData"
import {
	IVeracityAuthFlowStrategySettingsRequired
} from "../internalInterfaces/IVeracityAuthFlowStrategySettingsRequired"
import {
	IVIDPRefreshTokenRequestParameters,
	IVIDPRefreshTokenResponseSuccess
} from "../internalInterfaces/veracityIDPReqRes"
import { createUid } from "../utils/createUid"
import getVeracityAuthMetadata from "../utils/getVeracityAuthMetadata"
import { request } from "../utils/request"
import { validateIDTokenAndAccessToken } from "../utils/validation"
import { VeracityAuthFlowStrategyContext } from "../utils/VeracityAuthFlowStrategyContext"
import { VIDPError } from "./errors/VIDPError"
import { tokenRefreshStrategies } from "./tokenRefreshStrategies"

/**
 * Defines a strategy for authenticating with Veracity and aquiring access tokens using the
 * Authorization Code grant flow.
 *
 * It supports negotiating for multiple access tokens for different services (api scopes).
 */
export class VeracityAuthFlowStrategy<TUser = any> implements Strategy {
	/**
	 * Used for internal calls to the methods provided by PassportJs.
	 * This ensures typings work correctly.
	 */
	public get self(): StrategyCreatedStatic {
		return this as any
	}
	public name?: string
	public settings: IVeracityAuthFlowStrategySettingsRequired

	public constructor(
		settings: IVeracityAuthFlowStrategySettings,
		private verifier: VerifierFunction<TUser>
	) {
		if (!settings.clientId) {
			throw new VIDPError("setting_error",
				"The clientId setting is required.")
		}
		if (!settings.clientSecret) {
			throw new VIDPError("setting_error",
				"The clientSecret setting is required.")
		}
		if (!settings.replyUrl) {
			throw new VIDPError("setting_error",
				"The replyUrl setting is required.")
		}

		this.settings = {
			tenantId: "a68572e3-63ce-4bc1-acdc-b64943502e9d",
			policy: "B2C_1A_SignInWithADFSIdp",
			logoutRedirectUrl: "https://www.veracity.com/auth/logout",
			apiScopes: ["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"],
			requestRefreshTokens: true,
			...settings
		}
	}

	public async authenticate(req: Request, options?: any) {
		if (!req.session) {
			this.self.error(new VIDPError("missing_dependency", "Session support is required for this Veracity strategy. "+
				"Please ensure sessions are enabled before authenticating."))
			return
		}

		try {
			const context = new VeracityAuthFlowStrategyContext(req, this.settings)
			const nextResult = await context.next()
			if (!nextResult) {
				return this.verifier({
						idToken: context.idToken!,
						idTokenDecoded: context.idTokenDecoded!,
						apiTokens: context.readyTokens
					}, this.done.bind(this), req)
			}
			this.self.redirect(nextResult)
		} catch (error) {
			if (!(error instanceof VIDPError)) {
				const vidpError = new VIDPError("unknown_error", error.message, error)
				this.self.error(vidpError)
				return
			}
			this.self.error(error)
		}
	}

	/**
	 * This function returns a Connect-compatible request handler that will refresh the requested token
	 * if the provided strategy returns true. The default strategy will refresh the token if it has less
	 * than half its lifetime remaining.
	 * @param newTokenHandler The handler that is responsible for storing the new access token data.
	 * @param refreshStrategy The strategy used to determine if a token should be refreshed.
	 */
	public refreshTokenMiddleware = (
		newTokenHandler:
			(tokenData: IVeracityTokenData, req: Request) => void | Promise<void>,
		refreshStrategy?: (issueTime: number, expireTime: number, lifetime: number) => boolean
		) => (tokenApiScopeOrResolver:
			string | ((req: Request) => IVeracityTokenData | Promise<IVeracityTokenData>)
		)=> async (req: Request, res: Response, next: NextFunction) => {
		try {
			refreshStrategy = refreshStrategy || tokenRefreshStrategies.halfLifetime
			const oldTokenData = await this.resolveTokenData(tokenApiScopeOrResolver, req)
			if (!refreshStrategy(
				oldTokenData.accessTokenIssued,
				oldTokenData.accessTokenExpires,
				oldTokenData.accessTokenLifetime)) {
				next()
				return
			}

			const newTokenData = await this.refreshToken(oldTokenData)
			await newTokenHandler(newTokenData, req)
			next()
		} catch (error) {
			if (!(error instanceof VIDPError)) {
				const vidpError = new VIDPError("unknown_error", error.message, error)
				next(vidpError)
				return
			}
			next(error)
		}
	}
	/**
	 * Refresh the given token
	 * @param tokenData The token data for the token to refresh
	 * @param req The request object for this request
	 */
	public async refreshToken(tokenData: IVeracityTokenData) {
		if (!tokenData.refreshToken) {
			throw new VIDPError("unsupported_context",
				`The token with scope "${tokenData.scope}" does not have a refresh token.`)
		}
		if (tokenData.refreshTokenExpires && tokenData.refreshTokenExpires < (Date.now() / 1000)) {
			throw new VIDPError("token_expired",
				`The refresh token with scope "${tokenData.scope}" has expired and cannot be refreshed.`)
		}

		try {
			const newTokenData = await this.getRefreshedToken(tokenData)
			return newTokenData
		} catch (error) {
			if (!(error instanceof VIDPError)) {
				throw new VIDPError("unknown_error", error.message, error)
			}
			throw error
		}
	}
	/**
	 * Log the user out by calling req.logout and redirecting them to the logout page on
	 * Veracity to complete the process.
	 */
	public logout = (req: Request, res: Response) => {
		req.logout()
		res.redirect(this.settings.logoutRedirectUrl)
	}

	private async getRefreshedToken(tokenData: IVeracityTokenData) {
		const {tenantId, policy, clientId, clientSecret, replyUrl} = this.settings
		const metadata = await getVeracityAuthMetadata({tenantId, policy})
		const nonce = createUid()
		const form: IVIDPRefreshTokenRequestParameters = {
			grant_type: "refresh_token",
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: replyUrl,
			scope: ["openid", tokenData.scope].join(" "),
			refresh_token: tokenData.refreshToken!,
			nonce
		}
		const rawRefreshResponse = await request(metadata.token_endpoint, {
			method: "POST",
			form
		})
		const refreshResponse = JSON.parse(rawRefreshResponse) as IVIDPRefreshTokenResponseSuccess
		const {
			accessToken,
			accessTokenDecoded,
			idToken,
			idTokenDecoded
		} = await (async () => {
			return validateIDTokenAndAccessToken(refreshResponse.access_token, {
				nonce,
				clientId: this.settings.clientId,
				idToken: refreshResponse.id_token,
				issuer: metadata.issuer,
				jwks: metadata.jwks
			})
		})()
		return {
			...tokenData,
			accessToken,
			accessTokenDecoded: accessTokenDecoded.payload,
			idToken,
			idTokenDecoded: idTokenDecoded.payload,
			accessTokenIssued: accessTokenDecoded.payload.iat,
			accessTokenExpires: accessTokenDecoded.payload.exp,
			accessTokenLifetime: parseInt(refreshResponse.expires_in, 10)
		}
	}

	private resolveTokenData(
		resolverOrName: string | ((req: Request) => IVeracityTokenData | Promise<IVeracityTokenData>),
		req: Request) {
		if (typeof resolverOrName === "function") {
			return resolverOrName(req)
		}
		if (!req.user || !req.user.apiTokens) {
			throw new VIDPError("unsupported_context",
				`Unable to resolve token from "req.user". The object does not exist or has no api tokens on "req.user.apiTokens"`)
		}
		return req.user.apiTokens[resolverOrName] as IVeracityTokenData
	}

	/**
	 * The done function to send to the verifier once the request authentication process completes successfully.
	 */
	private done(err: any, user: TUser | null, info?: any) {
		if (err) return this.self.error(err)
		if (!user) return this.self.fail(info)
		this.self.success(user as any, info)
	}
}

export default VeracityAuthFlowStrategy
