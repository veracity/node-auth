import { Request } from "express"
import { Strategy, StrategyCreatedStatic } from "passport"
import { ICreateVIDPAuthorizationUrlParams } from "../auth/createVIDPAuthorizationUrl"
import { getVIDPMetadata } from "../auth/getVIDPMetadata"
import { IRequestVIDPAccessTokenParams } from "../auth/requestVIDPAccessToken"
import { VIDPOpenIDContext } from "../auth/VIDPOpenIDContext"
import { VERACITY_API_SCOPES, VERACITY_METADATA_ENDPOINT } from "../constants"
import { VIDPError, VIDPErrorSources, VIDPStrategyErrorCodes } from "../errors"
import { IVIDPTokenData, IVIDPWebAppStrategySettings } from "../interfaces"

/**
 * Express request object with key session that is express-session
 * or other, compatable session manager
 */
interface IRequestWithSession extends Request {
	session: any
}

export type VIDPWebAppStrategyVerifier<TUser = any> = (
	data: IVIDPTokenData, req: Request, done: (err: any, user?: TUser, info?: any) => void) => void | Promise<void>

/**
 * This strategy handles the OpenID Connect flow and exchange of one or more authorization tokens for
 * access tokens.
 */
export class VIDPWebAppStrategy<TUser = any> implements Strategy {
	public settings: IVIDPWebAppStrategySettings & Required<Omit<IVIDPWebAppStrategySettings, "clientSecret">>
	/**
	 * Used for internal calls to the methods provided by PassportJs.
	 * This ensures typings work correctly.
	 */
	private get self(): StrategyCreatedStatic {
		return this as any
	}

	public constructor(
		settings: IVIDPWebAppStrategySettings,
		private verifier: VIDPWebAppStrategyVerifier<TUser>
	) {
		this.settings = {
			apiScopes: [VERACITY_API_SCOPES.services],
			metadataURL: VERACITY_METADATA_ENDPOINT,
			...settings
		}

		if (!this.settings.clientId) {
			throw new VIDPError(
				VIDPStrategyErrorCodes.missing_required_setting,
				'Missing required setting "clientId"',
				VIDPErrorSources.strategy
			)
		}
		if (!this.settings.replyUrl) {
			throw new VIDPError(
				VIDPStrategyErrorCodes.missing_required_setting,
				'Missing required setting "replyUrl"',
				VIDPErrorSources.strategy
			)
		}
	}

	public get authParams(): Omit<ICreateVIDPAuthorizationUrlParams, "authorizationURL" | "scope"> {
		return {
			client_id: this.settings.clientId,
			redirect_uri: this.settings.replyUrl
		}
	}
	public get accessTokenParams(): Omit<IRequestVIDPAccessTokenParams, "tokenURL" | "code" | "scope"> {
		return {
			client_id: this.settings.clientId,
			client_secret: this.settings.clientSecret,
			redirect_uri: this.settings.replyUrl
		}
	}

	public async authenticate(req: IRequestWithSession, options?: any) {
		try {
			const metadata = await getVIDPMetadata(this.settings.metadataURL)
			const context = new VIDPOpenIDContext(req, {
				apiScopes: this.settings.apiScopes,
				authParams: this.authParams,
				accessTokenParams: this.accessTokenParams
			}, metadata)

			const nextOp = await context.next()
			if (!nextOp) { // We are done with authentication
				const {data, query, ...tokenData} = context.currentTokenData!
				req.query = {
					...query
				}
				if (data) {
					(req as any).veracityAuthState = data
				}
				try {
					return this.verifier(tokenData, req, this._verifierDone.bind(this))
				} catch (error) {
					throw new VIDPError(
						VIDPStrategyErrorCodes.verifier_error,
						error.message,
						VIDPErrorSources.verifier,
						{idToken: context.currentTokenData!.idToken},
						error
					)
				}
			}

			this.self.redirect(nextOp)
		} catch (error) {
			if (error instanceof VIDPError) {
				this.self.error(error)
				return
			}
			const vidpError = new VIDPError(
				VIDPStrategyErrorCodes.unknown_error,
				error.message,
				VIDPErrorSources.strategy,
				{},
				error)
			vidpError.stack = error.stack
			this.self.error(vidpError)
		}
	}

	/**
	 * The done function to send to the verifier once the request authentication process completes successfully.
	 */
	private _verifierDone(err: any, user?: TUser, info?: any) {
		if (err) return this.self.error(err)
		if (!user) return this.self.fail(info)
		this.self.success(user as any, info)
	}
}
