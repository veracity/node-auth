// Import the dependencies we need
const express = require("express")
const https = require("https")
const { MemoryStore } = require("express-session")
const {
	setupWebAppAuth,
	generateCertificate
} = require("@veracity/node-auth")

// Create our express instance
const app = express()

// Create the strategy object and configure it
const { refreshTokenMiddleware } = setupWebAppAuth({
	app,
	strategy: { // Fill these in with values from your Application Credential
		clientId: "",
		clientSecret: "",
		replyUrl: "",
	},
	session: {	
		secret: "ce4dd9d9-cac3-4728-a7d7-d3e6157a06d9", // Replace this with your own secret
		store: new MemoryStore() // Use MemoryStore only for local development
	},
	logLevel: "info"
})

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
app.get("/refresh", refreshTokenMiddleware(), (req, res) => {
	console.log("Refreshed token")
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