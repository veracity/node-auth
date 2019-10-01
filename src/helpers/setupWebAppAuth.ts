import bodyParser from "body-parser"
import { Request, Response } from "express"
import sessionMiddleware from "express-session"
import passport from "passport"
import { createRefreshTokenMiddleware, VIDPWebAppStrategy } from "../api"
import { VERACITY_LOGOUT_URL, VERACITY_METADATA_ENDPOINT } from "../constants"
import { ISetupWebAppAuthSettings } from "../interfaces"
import { getUrlPath } from "../utils/getUrlPath"
import makeSessionConfigObject from "./makeSessionConfigObject"

export const setupWebAppAuth = <TUser = any>(
	settings: ISetupWebAppAuthSettings) => {
	const {
		name = "veracity_oidc",

		app,
		session,
		strategy,

		loginPath = "/login",
		logoutPath = "/logout",

		onBeforeLogin = (req: any, res: any, next: any) => {next()},
		onVerify = (data: any, req: any, done: any) => {done(null, data)},
		onLoginComplete = (req: Request, res: Response) => {
			res.redirect(req.query.returnTo || "/")
		},
		onLoginError = (err: any, req: any, res: any, next: any) => {
			next(err)
		}
	} = settings

	app.use(sessionMiddleware(makeSessionConfigObject(session)))
	app.use(passport.initialize())
	app.use(passport.session())

	const strategyInstance = new VIDPWebAppStrategy<TUser>(strategy, onVerify)
	passport.use(name, strategyInstance)
	passport.serializeUser((user, done) => { done(null, user) })
	passport.deserializeUser((id, done) => { done(null, id) })

	app.get(loginPath, onBeforeLogin, passport.authenticate(name), (req, res, next) => {
		next(new Error("If you can see this please copy everything on this page "+
			"and report the error on https://github.com/veracity/node-veracity-auth/issues"
		))
	})
	app.post(
		getUrlPath(strategy.replyUrl),
		bodyParser.urlencoded({extended: true}),
		passport.authenticate(name),
		onLoginComplete, onLoginError)
	app.get(logoutPath, (req, res) => {
		req.logout()
		res.redirect(VERACITY_LOGOUT_URL)
	})

	const refreshTokenMiddleware = createRefreshTokenMiddleware(strategy,
		(tokenData, req) => {
			const anyReq: any = req
			Object.assign(anyReq.user.accessTokens, {
				[tokenData.scope]: tokenData
			})
		}, strategy.metadataURL || VERACITY_METADATA_ENDPOINT)

	return {
		refreshTokenMiddleware,
		name
	}
}
