import { Request } from "express"
import { Strategy, StrategyCreatedStatic } from "passport"
import {
	IVeracityAuthFlowStrategySettings, IVeracityIDTokenPayload, IVeracityTokenData
} from "../interfaces"
import { VeracityAuthFlowStrategyContext } from "./VeracityAuthFlowStrategyContext"

export interface IVeracityAuthFlowVerifierOptions {
	idToken: IVeracityIDTokenPayload
	apiTokens?: {[apiScope: string]: IVeracityTokenData}
}

/**
 * Defines a strategy for authenticating with Veracity and aquiring access tokens using the
 * Authorization Code grant flow.
 *
 * It supports negotiating for multiple access tokens for different services (api scopes).
 */
export class VeracityStrategy<TUser = any> implements Strategy {

	/**
	 * Used for internal calls to the methods provided by PassportJs.
	 * This ensures typings work correctly.
	 */
	public get self(): StrategyCreatedStatic {
		return this as any
	}
	public name?: string

	public constructor(
		private settings: IVeracityAuthFlowStrategySettings,
		private verifier: (
			options: IVeracityAuthFlowVerifierOptions,
			done: (err: any, user: TUser | null, info?: any) => void) => void | Promise<void>
	) { }

	public async authenticate(req: Request, options?: any) {
		if (!req.session) {
			this.self.error(new Error("Session support is required for this Veracity strategy. "+
				"Please ensure sessions are enabled before authenticating."))
			return
		}

		try {
			const context = new VeracityAuthFlowStrategyContext(req, this.settings)
			try {
				const nextResult = await context.next()
				if (!nextResult) {
					await this.verifier({
							idToken: context.idToken,
							apiTokens: context.readyTokens
						}, this.done)
				} else {
					this.self.redirect(nextResult)
				}
			} catch (error) {
				this.self.error(error)
			} finally {
				context.cleanUp()
			}
		} catch (error) {
			this.self.error(error)
		}
	}

	/**
	 * The done function to send to the verifier once the request authentication process completes successfully.
	 */
	private done = (err: any, user: TUser | null, info?: any) => {
		if (err) return this.self.error(err)
		if (!user) return this.self.fail(info)
		this.self.success(user as any, info)
	}
}
