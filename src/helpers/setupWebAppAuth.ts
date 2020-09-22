// This needs to be imported first to overwrite the "passport-azure-ad" logger
import { CustomLogger } from "./logger"

import bodyParser from "body-parser"
import { NextFunction, Request, Response } from "express"
import expressSession from "express-session"
import passport from "passport"
import { createRefreshTokenMiddleware } from "../api/createRefreshTokenMiddleware"
import { VIDPWebAppStrategy } from "../api/VIDPWebAppStrategy"
import { ISetupWebAppAuthSettings  } from "../interfaces"
import { mergeConfig, validateConfig } from "../utils/configHelpers"
import { getUrlPath } from "../utils/getUrlPath"
import { safeStringify } from "../utils/safeStringify"
import authConfig from "./defaultAuthConfig"
import { makeSessionConfigObject } from "./makeSessionConfigObject"

// Small helper that ensures the policy query parameter is set.
// If you have links on the client that specify the p=[policy] query paramter this is not needed.
// We do this since we know which policy to use in all cases and wish to avoid hard coding this into links for the client.
const ensureSignInPolicyQueryParameter = (policyName: string) => (req: Request, res: Response, next: NextFunction) => {
	req.query.p = req.query.p || policyName
	next()
}

const authenticator = (name: string, errorPath: string) => (req: Request & {veracityAuthState?: string | object}, res: Response, next: NextFunction) => {
	return passport.authenticate(name, {
		customState: safeStringify({authState: req.veracityAuthState, query: req.query}),
		failureRedirect: errorPath // Where to route the user if the authentication fails
	} as any)(req, res, next)
}

const ensureVeracityAuthState = (req: Request & { veracityAuthState?: any }, res: Response, next: NextFunction) => {
	if (req.body && req.body.state) {
		const { authState, query } = JSON.parse(req.body.state)
		req.veracityAuthState = authState
		req.query = query || req.query
	}
	next()
}

export const setupWebAppAuth = (config: ISetupWebAppAuthSettings) => {
	validateConfig(config)
	const { app, logger: providedLogger, ...rest } = config
	const fullConfig = mergeConfig(authConfig, rest)
	const sessionConfig = makeSessionConfigObject(fullConfig.session)

	const logger = new CustomLogger(fullConfig.oidcConfig.loggingLevel).registerLogger(providedLogger)

	const {
		onBeforeLogin,
		onVerify,
		onLoginComplete,
		onLogout
	} = fullConfig

	logger.info("Configuring session")

	// Set up session support for requests
	app.use(expressSession(sessionConfig))

	logger.info("Setting up auth strategy")

	// Create and configure the strategy instance that will perform authentication
	const strategy = new VIDPWebAppStrategy(fullConfig.oidcConfig as any, onVerify)

	// Register the strategy with passport
	passport.use(fullConfig.name, strategy)

	// Specify what information about the user should be stored in the session. Here we store the entire user object we define in the 'verifier' function.
	// You can pick only parts of it if you don't need all the information or if you have user information stored somewhere else.
	passport.serializeUser((user, done) => { done(null, user) })
	passport.deserializeUser((passportSession, done) => { done(null, passportSession) })

	logger.info("Connecting passport to application")

	// Now that passport is configured we need to tell express to use it
	app.use(passport.initialize()) // Register passport with our expressjs instance
	app.use(passport.session()) // We are using sessions to persist the login and must therefore also register the session middleware from passport.

	// Our login route. This is where the authentication magic happens.
	// We must ensure that the policy query parameter is set and we therefore include our small middleware before the actual login process.
	app.get(
		fullConfig.loginPath,
		onBeforeLogin,
		ensureSignInPolicyQueryParameter(fullConfig.policyName),
		authenticator(fullConfig.name, fullConfig.errorPath),
		(req: Request, res: Response) => {
			res.redirect(fullConfig.errorPath) // This redirect will never be used unless something failed. The return-url when login is complete is configured as part of the application registration.
		}
	)

	// This route is where we retrieve the authentication information posted back from Azure B2C/ADFS.
	// To perform the necessary steps it needs to parse post data as well as sign in correctly. This is done using the body-parser middleware.
	app.post(
		getUrlPath(fullConfig.oidcConfig.redirectUrl),
		bodyParser.urlencoded({ extended: true }),
		authenticator(fullConfig.name, fullConfig.errorPath),
		ensureVeracityAuthState,
		onLoginComplete
	)

	// Our logout route handles logging out of B2C and removing session information.
	app.get(fullConfig.logoutPath, onLogout)

	return {
		refreshTokenMiddleware: createRefreshTokenMiddleware({
			clientID: fullConfig.oidcConfig.clientID,
			policyName: fullConfig.policyName,
			clientSecret: fullConfig.oidcConfig.clientSecret,
			identityMetadata: fullConfig.oidcConfig.identityMetadata,
			scope: fullConfig.oidcConfig.scope && typeof fullConfig.oidcConfig.scope !== "string" ? fullConfig.oidcConfig.scope.join(" ") : fullConfig.oidcConfig.scope
		})
	}
}
