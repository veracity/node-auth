// Import our dependencies

const express = require("express") // Express will handle requests to our server
const https = require("https") // HTTPS enables a secure web server
const { MemoryStore } = require("express-session")

const generateCerts = require("./generateCerts") // Helps us generate self-signed certificates so our HTTPS server works
const credentials = require("./credentials") // Get the secret credentials for our application

// Imports the helper function that will aid us in setting up everything needed to authenticate
const {setupAuthFlowStrategy} = require("@veracity/node-auth/lib/helpers")

// Create the application instance for our express application
const app = express()

// Now we use the helper function provided by @veracity/node-auth to configure our application to allow
// authenticating with the Veracity Identity Provider
setupAuthFlowStrategy({
	appOrRouter: app, // The helper will configure our app so we need to provide the instance
	loginPath: "/login", // Where will users go to log in
	strategySettings: { // These are settings for the passport strategy we use to authenticate with Veracity
		...credentials, // We need to provide our application credentials
		apiScopes: [], // By default the helper will negotiate a token for the Services API on Veracity for us. We don't need this here so we simply set apiScopes to an empty array
		redirectUri: "https://localhost:3000/auth/oidc/loginreturn" // and the redirect url we registered in Veracity for Developers
	},
	sessionSettings: { // These settings configure our session. You can specify any express-session setting here.
		secret: "298a5530-b5d0-4e52-95f8-5b2d2a4425a2", // Define a secret that is used to sign our session cookie
		store: new MemoryStore() // Use the development memory store for session data
	},

	/**
	 * This function is run after the authentication process is completed. It allows us to define 
	 * what we want to store in the user object in session.
	 */
	onVerify: (options, done, req) => { // req is not used
		done(null, options) // We store everything we get back from the Veracity IDP in our user object.
	},

	/**
	 * This function is the handler that executes after authentication is completed and the user object is set.
	 * Here we can do anything we want, but it's common to redirect the user back to the page they were on when
	 * they started the login process.
	 */
	onLoginComplete: (req, res, next) => {
		res.redirect(req.query.returnTo || "/")
	}
})

// Set up a handler on the root of our application so we can see that it's working.
app.get("/", (req, res) => {
	res.send(`Click <a href="/login"/>here</a> to log in`)
})
// A debugging endpoint that will show us the user object currently in session
app.get("/user", (req, res) => {
	res.send(req.user)
})


// Set up an https server using a self-signed certificate
const server = https.createServer({
	...generateCerts() // Generates KEY and PEM certificates for our server
}, app)
server.on("error", (error) => { // Should an error occur we will log it and terminate the process abnormally
	console.error(error)
	process.exit(1) // Exiting with something other than 0 indicates to the OS that the process failed in some way.
})
server.listen(3000, () => { // Finally start listening for connections on port 3000
	console.log("Server listening for connections on https://localhost:3000")
})