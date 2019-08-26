import bodyParser from "body-parser"
import session from "express-session"
import passport from "passport"
import { VeracityAuthFlowStrategy } from "../auth/VeracityAuthFlowStrategy"
import { ISetupAuthFlowOptions } from "../interfaces/ISetupAuthFlowOptions"
import makeSessionConfigObject from "./makeSessionConfigObject"

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
 * @return Returns the strategy instance
 */
export const setupAuthFlowStrategy = <TUser = any>(options: ISetupAuthFlowOptions) => {
	const {
		appOrRouter: app,
		loginPath = "/login",
		logoutPath = "/logout",
		strategySettings,
		sessionSettings,
		onBeforeLogin = (req: any, res: any, next: any) => {next()},
		onVerify = (verifyOptions: any, done: any) => {
			done(null, verifyOptions)
		},
		onLoginComplete = (req: any, res: any) => {res.redirect(req.query.returnTo || "/")}
	} = options
	const name = "veracityauthflow"

	app.use(session(makeSessionConfigObject((sessionSettings))))
	app.use(passport.initialize())
	app.use(passport.session())

	const strategy = new VeracityAuthFlowStrategy<TUser>(strategySettings, onVerify)
	passport.use(name, strategy)
	passport.serializeUser((user, done) => { done(null, user) })
	passport.deserializeUser((id, done) => { done(null, id) })

	app.get(loginPath, onBeforeLogin, passport.authenticate(name), (req, res) => {
		res.send({
			message: "If you can see this please copy everything on this page "+
				"and report the error on https://github.com/veracity/node-veracity-auth/issues"
		})
	})
	app.post(
		getUrlPath(strategySettings.replyUrl),
		bodyParser.urlencoded({extended: true}),
		passport.authenticate(name),
		onLoginComplete)
	app.get(logoutPath, strategy.logout)

	return strategy
}
