// tslint:disable: max-line-length

// Import the dependencies we need
import {
	createEncryptedSessionStore,
	createRefreshTokenMiddleware,
	generateCertificate,
	makeSessionConfigObject,
	VERACITY_API_SCOPES,
	VERACITY_LOGOUT_URL,
	VERACITY_METADATA_ENDPOINT,
	VIDPWebAppStrategy
} from "@veracity/node-auth"
import { IVIDPWebAppStrategySettings } from "@veracity/node-auth/interfaces"
import bodyParser from "body-parser"
import express from "express"
import session, { MemoryStore } from "express-session"
import https from "https"
import passport from "passport"

// Create our express instance
const app = express()

// Create an encrypted version of the memory store to ensure tokens are encrypted at rest.
// This is an optional, but recommeded step.
const encryptedSessionStorage = createEncryptedSessionStore("encryptionKey")(new MemoryStore())

// Set up session and passport
app.use(session(makeSessionConfigObject({
	secret: "ce4dd9d9-cac3-4728-a7d7-d3e6157a06d9", // Replace this with your own secret
	store: encryptedSessionStorage
})))

// Initialize and configure passport
app.use(passport.initialize())
app.use(passport.session())
const strategySettings: IVIDPWebAppStrategySettings = { // Equivalent to the strategy property
	clientId: "",
	clientSecret: "",
	replyUrl: "",
	apiScopes: [VERACITY_API_SCOPES.services]
}
const strategy = new VIDPWebAppStrategy(
	strategySettings,
	(data, req, done) => { // Our verifier function (equivalent to onVerify)
		done(null, data)
	}
)
const strategyName = "veracity_oidc" // The name of our strategy
passport.use(strategyName, strategy)
passport.serializeUser((user, done) => { done(null, user) })
passport.deserializeUser((id, done) => { done(null, id) })

// Create our login endpoint
app.get("/login",
	(req, res, next) => { // This is equivalent to onBeforeLogin and can be removed if not used
		next()
	},
	passport.authenticate(strategyName), // Begin authenticating with passport
	(req, res, next) => { // This handler will never be called in normal operation, but we log an error if it does
		next(new Error("Login handler reached, this should not happen."))
	}
)

// Create our return endpoint when the Veracity IDP has completed authentication
app.post("/auth/oidc/loginreturn",
	bodyParser.urlencoded({extended: true}), // Decode body of request
	passport.authenticate(strategyName), // Continue authentication by exchanging auth code for access token and optionally redirecting to another login
	(req, res, next) => { // Equivalent to onLoginComplete. This is called once all tokens have been retrieved
		res.redirect(req.query.returnTo || "/") // Redirect back to root or to the returnTo param sent to "/login"
	}
)

// Set up our logout path
app.get("/logout",
	(req, res) => {
		req.logout() // Destroy our internal session
		res.redirect(VERACITY_LOGOUT_URL) // Redirect to central logout for all Veracity Services
	}
)

// The last feature we need to configure is the refresh middleware.
const refreshTokenMiddleware = createRefreshTokenMiddleware(
	strategySettings,
	(tokenData, req) => {
		const anyReq: any = req
		Object.assign(anyReq.user.accessTokens, {
			[tokenData.scope]: tokenData
		})
	},
	VERACITY_METADATA_ENDPOINT
)

// Now we can continue with our normal handlers as in the other samples

// This endpoint will return our user data so we can inspect it.
app.get("/user", (req, res) => {
	if (req.isAuthenticated()) {
		res.send(req.user)
		return
	}
	res.status(401).send("Unauthorized")
})

// Create an endpoint where we can refresh the services token.
// By default this will refresh it when it has less than 5 minutes until it expires.
app.get("/refresh", refreshTokenMiddleware(VERACITY_API_SCOPES.services), (req, res) => {
	res.send({
		updated: Date.now(),
		user: req.user
	})
})

// Serve static content from the public folder so we can display the index.html page
app.use(express.static("public"))

// Set up the HTTPS development server
const server = https.createServer({
	...generateCertificate() // Generate self-signed certificates for development
}, app)
server.on("error", (error) => { // If an error occurs halt the application
	console.error(error)
	process.exit(1)
})
server.listen(3000, () => { // Begin listening for connections
	console.log("Listening for connections on port 3000")
})
