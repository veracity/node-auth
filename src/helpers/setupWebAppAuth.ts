import bodyParser from "body-parser"
import { NextFunction, Request, Response } from "express"
import expressSession from "express-session"
import passport from "passport"
import { OIDCStrategy, VerifyOIDCFunction } from "passport-azure-ad"
import { createRefreshTokenMiddleware } from "../api/createRefreshTokenMiddleware"
import { getUrlPath } from "../utils/getUrlPath"
import { IDefaultAuthConfig, IFullAuthConfig } from './../interfaces/IDefaultAuthConfig'
import { IEndUserConfig } from './../interfaces/IEndUserConfig'
import authConfig from "./defaultAuthConfig"
import { makeSessionConfigObject } from "./makeSessionConfigObject"

// Small helper that ensures the policy query parameter is set.
// If you have links on the client that specify the p=[policy] query paramter this is not needed.
// We do this since we know which policy to use in all cases and wish to avoid hard coding this into links for the client.
const ensureSignInPolicyQueryParameter = (policyName: string) => (req: Request, res: Response, next: NextFunction) => {
	req.query.p = req.query.p || policyName
	next()
}

const authenticator = (errorPath: string) => passport.authenticate("veracity-oidc", {
	failureRedirect: errorPath // Where to route the user if the authentication fails
})

const verifier: VerifyOIDCFunction = (iss, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
	const { expires_in, expires_on } = params
	const additionalInfo: {accessTokenExpires?: number, accessTokenLifetime?: number} = {}
	if (expires_in) additionalInfo.accessTokenExpires =  Number(expires_in)
	if (expires_on) additionalInfo.accessTokenLifetime = Number(expires_on)
	const user = { // Extract information from the data returned from B2C/ADFS
		name: jwtClaims.name,
		id: jwtClaims.oid,
		displayName: profile.displayName,

		// "https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75"
		tokens: {
			services: {
				access_token: accessToken,
				refresh_token: refreshToken,
				...additionalInfo
			}
		}
	}

	done(null, user) // Tell passport that no error occured (null) and which user object to store with the session.
}

const mergeConfig = (defaultConfig: IDefaultAuthConfig, endUserConfig: Omit<IEndUserConfig, "app">): IFullAuthConfig => {
	const { onBeforeLogin, onLoginComplete, onLoginError, onLogout, onVerify} = endUserConfig
	const config = {
		...defaultConfig,
		oidcConfig: {
			...defaultConfig.oidcConfig,
			clientID: endUserConfig.strategy.clientId,
			clientSecret: endUserConfig.strategy.clientSecret,
			redirectUrl: endUserConfig.strategy.replyUrl,
			scope: [...(defaultConfig.oidcConfig.scope || []), ...(endUserConfig.strategy.apiScopes || [])],
			identityMetadata: endUserConfig.strategy.metadataURL ? endUserConfig.strategy.metadataURL : defaultConfig.oidcConfig.identityMetadata
		},
		session: endUserConfig.session
	}
	if (endUserConfig.logLevel) config.oidcConfig.loggingLevel = endUserConfig.logLevel
	if (onBeforeLogin) config.onBeforeLogin = onBeforeLogin
	if (onLoginComplete) config.onLoginComplete = onLoginComplete
	if (onLoginError) config.onLoginError = onLoginError
	if (onLogout) config.onLogout = onLogout
	if (onVerify) config.onVerify = onVerify
	return config
}

const validateConfig = (config: IEndUserConfig) => {
	if (!config.app) throw new Error("'app' is required in config.")
	if (!config.strategy) throw new Error("'strategy' is required in config.")
	if (!config.strategy.clientId) throw new Error("'clientId' is required in strategy config.")
	if (!config.strategy.replyUrl) throw new Error("'replyUrl' is required in strategy config.")
}

export const setupWebAppAuth = (config: IEndUserConfig) => {
	validateConfig(config)
	const { app, ...rest } = config

	const fullConfig = mergeConfig(authConfig, rest)
	const sessionConfig = makeSessionConfigObject(fullConfig.session)

	const {
		onBeforeLogin,
		onVerify,
		onLoginComplete,
		onLoginError
	} = fullConfig

	// log.debug("Configuring session")

	// Set up session support for requests
	app.use(expressSession(sessionConfig))

	// log.debug("Setting up auth strategy")

	// Create and configure the strategy instance that will perform authentication
	const strategy = new OIDCStrategy(fullConfig.oidcConfig as any, onVerify || verifier)

	// Register the strategy with passport
	passport.use("veracity-oidc", strategy)

	// Specify what information about the user should be stored in the session. Here we store the entire user object we define in the 'verifier' function.
	// You can pick only parts of it if you don't need all the information or if you have user information stored somewhere else.
	passport.serializeUser((user, done) => { done(null, user) })
	passport.deserializeUser((passportSession, done) => { done(null, passportSession) })

	// log.debug("Connecting passport to application")

	// Now that passport is configured we need to tell express to use it
	app.use(passport.initialize()) // Register passport with our expressjs instance
	app.use(passport.session()) // We are using sessions to persist the login and must therefore also register the session middleware from passport.

	// Our login route. This is where the authentication magic happens.
	// We must ensure that the policy query parameter is set and we therefore include our small middleware before the actual login process.
	app.get(fullConfig.loginPath, onBeforeLogin, ensureSignInPolicyQueryParameter(fullConfig.policyName), authenticator(fullConfig.errorPath), (req: Request, res: Response) => {
		res.redirect(fullConfig.errorPath) // This redirect will never be used unless something failed. The return-url when login is complete is configured as part of the application registration.
	})

	// This route is where we retrieve the authentication information posted back from Azure B2C/ADFS.
	// To perform the necessary steps it needs to parse post data as well as sign in correctly. This is done using the body-parser middleware.
	app.post(getUrlPath(fullConfig.oidcConfig.redirectUrl), bodyParser.urlencoded({ extended: true }), authenticator(fullConfig.errorPath), onLoginComplete, onLoginError)

	// Our logout route handles logging out of B2C and removing session information.
	app.get(fullConfig.logoutPath, (req: Request, res: Response) => { // Overview step 8
		// First we instruct the session manager (express-session) to destroy the session information for this user.
		if (req.session) {
			req.session.destroy(() => {
				// Then we call the logout function placed on the req object by passport to sign out of Azure B2C
				req.logout()
				// Finally we redirect to Azure B2C to destroy the session information. This will route the user to the /logoutadfs route when done.
				res.redirect(fullConfig.destroySessionUrl)
			})
		}
	})

	return {
		refreshTokenMiddleware: createRefreshTokenMiddleware({
			clientID: fullConfig.oidcConfig.clientID,
			tenantID: fullConfig.tenantID,
			policyName: fullConfig.policyName,
			clientSecret: fullConfig.oidcConfig.clientSecret,
			scope: fullConfig.oidcConfig.scope && typeof fullConfig.oidcConfig.scope !== "string" ? fullConfig.oidcConfig.scope.join(" ") : fullConfig.oidcConfig.scope
		})
	}
}
