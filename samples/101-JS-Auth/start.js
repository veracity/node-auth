// Import the dependencies we need
const express = require("express")
const https = require("https")
const { MemoryStore } = require("express-session")
const { setupAuthFlowStrategy, generateCertificate } = require("@veracity/node-auth/helpers")

// Create our express instance
const app = express()

// Create the strategy object and configure it
const strategy = setupAuthFlowStrategy({
	appOrRouter: app,
	strategySettings: { // Fill these in with values from your Application Credential
		clientId: "",
		clientSecret: "",
		replyUrl: ""
	},
	sessionSettings: {
		secret: "ce4dd9d9-cac3-4728-a7d7-d3e6157a06d9", // Replace this with your own secret
		store: new MemoryStore() // Use memory store for local development
	}
})

// Construct the refresh token middleware factory.
// Using this we can refresh any token
const createRefreshTokenMiddleware = strategy.refreshTokenMiddleware((tokenData, req) => {
	req.user.apiTokens = { // Put the new token data onto the user object so it's stored in session
		[tokenData.scope]: tokenData
	}
}, () => true) // This refresh strategy will allways refresh the token

// strategy.settings.apiScopes[0] is the Services API scope
const refreshServicesToken = createRefreshTokenMiddleware(strategy.settings.apiScopes[0])

// This endpoint will return our user data so we can inspect it.
app.get("/user", (req, res) => {
	if (req.isAuthenticated()) {
		res.send(req.user)
		return
	}
	res.status(401).send("Unauthorized")
})

// Create the refresh token endpoint
app.get("/refresh", refreshServicesToken, (req, res) => {
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