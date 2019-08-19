import { RequestHandler, Router } from "express-serve-static-core"
import { VeracityAuthFlowStrategy } from "../auth/VeracityAuthFlowStrategy"
import {
	IVeracityAuthFlowStrategySettings,
	VerifierFunction
} from "../interfaces"
import { defaultAuthFlowStrategySettings } from "./defaultAuthFlowStrategySettings"
import makeSessionConfigObject, { IMakeSessionConfigObjectOptions } from "./makeSessionConfigObject"

import bodyParser from "body-parser"
import session from "express-session"
import passport from "passport"

export interface ISetupAuthFlowOptions<TUser = any> {
	/**
	 * Required to attach passport and session middleware as well as setting up your authentication routes.
	 * Usually this is an express application instance, but a router is also supported.
	 */
	appOrRouter: Router
	/**
	 * Specify the url path where users can log in. E.g.: /auth/login
	 */
	loginPath: string

	/**
	 * A handler that is run before the login process begins.
	 * Note that this handler MUST call next() in order to continue the login process.
	 */
	onBeforeLogin?: RequestHandler
	/**
	 * A function that is called once the user has completely logged in.
	 * Here you can specify how the user object will look when it's attached to req.user
	 */
	onVerify?: VerifierFunction<TUser>
	/**
	 * The handler to call when the login has completed.
	 */
	onLoginComplete: RequestHandler

	/**
	 * Define all required settings to set up the Veracity authentication strategy.
	 */
	strategySettings: Omit<IVeracityAuthFlowStrategySettings,
		"tenantId" | "policy" | "requestRefreshToken" | "configuration">,
	/**
	 * Define required settings for the session middleware.
	 */
	sessionSettings: IMakeSessionConfigObjectOptions
}

const getUrlPath = (absoluteUrl: string) => {
	try {
		const parsed = new URL(absoluteUrl)
		return parsed.pathname
	} catch (error) {
		throw new Error("The url was not absolute or parsing failed: "+error.message)
	}
}

/**
 * This function helps you set up everything needed to authenticate with Veracity.
 * It uses the recommeded default settings for all configurations.
 * You should call this function as soon as you have an express application instance available.
 * You need to ensure you have the following npm packages installed before proceeding:
 *
 * - express
 * - express-session
 * - passport
 * - body-parser
 *
 * They are set as optional dependencies of this library.
 */
export const setupAuthFlowStrategy = <TUser = any>(options: ISetupAuthFlowOptions) => {
	const {
		appOrRouter: app,
		loginPath,
		onBeforeLogin = (req: any, res: any, next: any) => {next()},
		onVerify = (verifyOptions: any, done: any) => {
			done(null, verifyOptions)
		},
		onLoginComplete,
		strategySettings,
		sessionSettings
	} = options
	const name = "veracityauthflow"

	app.use(session(makeSessionConfigObject((sessionSettings))))
	app.use(passport.initialize())
	app.use(passport.session())

	const allStrategySettings: IVeracityAuthFlowStrategySettings = {
		...defaultAuthFlowStrategySettings,
		...strategySettings
	}
	passport.use(name, new VeracityAuthFlowStrategy<TUser>(allStrategySettings, onVerify))
	passport.serializeUser((user, done) => { done(null, user) })
	passport.deserializeUser((id, done) => { done(null, id) })

	app.get(loginPath, onBeforeLogin, passport.authenticate(name), (req, res) => {
		res.send({
			message: "If you can see this please copy everything on this page "+
				"and report the error on https://github.com/veracity/node-veracity-auth/issues"
		})
	})
	app.post(
		getUrlPath(strategySettings.redirectUri),
		bodyParser.urlencoded({extended: true}),
		passport.authenticate(name),
		onLoginComplete)
}
