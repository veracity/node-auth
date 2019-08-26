import { RequestHandler, Router } from "express-serve-static-core"
import { IMakeSessionConfigObjectOptions } from "./IMakeSessionConfigObject"
import { IVeracityAuthFlowStrategySettings } from "./IVeracityAuthFlowStrategySettings"
import { VerifierFunction } from "./IVeracityAuthFlowStrategyVerifierOptions"

export interface ISetupAuthFlowOptions<TUser = any> {
	/**
	 * Required to attach passport and session middleware as well as setting up your authentication routes.
	 * Usually this is an express application instance, but a router is also supported.
	 */
	appOrRouter: Router
	/**
	 * Specify the url path where users can log in. E.g.: /auth/login
	 * @default "/login"
	 */
	loginPath?: string
	/**
	 * Specify the url path where users can log out
	 * @default "/logout"
	 */
	logoutPath?: string

	/**
	 * Define all required settings to set up the Veracity authentication strategy.
	 */
	strategySettings: IVeracityAuthFlowStrategySettings,
	/**
	 * Define required settings for the session middleware.
	 */
	sessionSettings: IMakeSessionConfigObjectOptions

	/**
	 * A handler that is run before the login process begins.
	 * Note that this handler MUST call next() in order to continue the login process.
	 * @default function Passthrough function
	 */
	onBeforeLogin?: RequestHandler
	/**
	 * A function that is called once the user has completely logged in.
	 * Here you can specify how the user object will look when it's attached to req.user
	 * @default function Passthrough that stores everything
	 */
	onVerify?: VerifierFunction<TUser>
	/**
	 * The handler to call when the login has completed.
	 * Defaults to handler that redirects you to whatever was sent in the returnTo query parameter on login or to "/".
	 * @default function
	 */
	onLoginComplete?: RequestHandler
}
