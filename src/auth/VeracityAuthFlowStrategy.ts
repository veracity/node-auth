import { Request } from "express"
import passport, { Strategy, StrategyCreatedStatic } from "passport"
import {
	IVeracityAuthFlowStrategySettings,
	IVeracityAuthFlowStrategySettingsRequired,
	VerifierFunction
} from "../interfaces"
import { VeracityAuthFlowStrategyContext } from "../utils/VeracityAuthFlowStrategyContext"

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
		if (!passport) {
			throw new Error(`Unable to dedect the passport dependency. Install it by running "npm i passport"`)
		}
		if (!settings.clientId) {
			throw new Error("The clientId setting is required.")
		}
		if (!settings.clientSecret) {
			throw new Error("The clientSecret setting is required.")
		}
		if (!settings.replyUrl) {
			throw new Error("The replyUrl setting is required.")
		}

		this.settings = {
			tenantId: "a68572e3-63ce-4bc1-acdc-b64943502e9d",
			policy: "B2C_1A_SignInWithADFSIdp",
			apiScopes: ["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"],
			requestRefreshTokens: true,
			...settings
		}
	}

	public async authenticate(req: Request, options?: any) {
		if (!req.session) {
			this.self.error(new Error("Session support is required for this Veracity strategy. "+
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
			this.self.error(error)
		}
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
