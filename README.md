# Veracity Authentication library for NodeJS
This library provides utilities that help with authentication-related operations using the Veracity Identity Provider.

**DISCLAIMER** This package is in alpha and is not yet completed and ready for production use.

**Current features**
- Authentication Strategy for PassportJS that performs Authorization Code flow authentication and token exchange for zero or more API tokens.
- Helper for configuring express, express-session and passport with the strategy.

It is highly recommended that you use a TypeScript aware IDE when using this library as much of the documentation is in the form of interfaces. Such IDEs can show detailed documentation as you work making it easier to use this library correctly. We suggest [Visual Studio Code](https://code.visualstudio.com/). The library **does not** require that you write your application using TypeScript.

## Quick Start
The library provides a way for you to set up passport with the strategy yourself OR use a convenient helper function that sets up not only passport, but also express-session and some good, default handlers for you. Depending on what you need you may choose one or the other.

In either case, before you begin you should go to the [Veracity for Developers project portal](https://developer.veracity.com/projects) and create an Application Credential resource. This will register your application with Veracity and allow it to perform authentication. You need three settings from this portal:
- Client ID
- Client Secret
- Reply URL

Once you have this information you can begin building your application.

### Using the helper function
**Note**: This setup requires the following dependencies: [express](https://expressjs.com/), [express-session](https://github.com/expressjs/session) and [body-parser](https://github.com/expressjs/body-parser).

To get started authentication your web application with Veracity first install the required dependencies:
```javascript
npm i express express-session body-parser
npm i passport @veracity/node-auth
```

Now you can set up your application using the helper function `setupAuthFlowStrategy`. See documentation of the settings below.
```javascript
const express = require("express")
const { MemoryStore } = require("express-session")
const {setupAuthFlowStrategy} = require("@veracity/node-auth/helpers")

const app = express() // Create our app instance

const settings = {
	appOrRouter: app,
	loginPath: "/login",
	strategySettings: { // These settings comes from the Veracity for Developers application credential
		clientId: "", // Your client id
		clientSecret: "", // Your client secret
		replyUrl: "" // Your reply url
	},
	sessionSettings: {
		secret: "66530082-b48b-41f1-abf5-0987eb156652",
		store: new MemoryStore() // We use a memory store here for development purposes, this is not suitable for production code.
	}
})
setupAuthFlowStrategy(settings)

app.get("/", (req, res) => {
	res.send(req.user) // Log the user object for debugging purposes
})

app.listen(3000, () => {
	console.log("Listening for connections on port 3000")
})
```

That's it. You should now be able to authenticate with Veracity using your application. It will automatically retrieve an access token for you for communicating with the Veracity Service API and store everything on the `req.user` object.

The helper function will automatically register two response handlers on your application:

```javascript
const settings = {
	// ... other settings are omitted for brevity
	loginPath: "/login",
	strategySettings: {
		replyUrl: "https://localhost:3000/auth/oidc/loginreturn"
	}
}

app.get(settings.loginPath, ...) // A GET handler on the "loginPath" setting to begin authentication
app.post(settings.strategySettings.replyUrl, ...) // A POST handler on the *path segment* of the replyUrl. It handles users returning from the login page.

// These are the equivalent paths when written out
app.get("/login", ...)
app.post("/auth/oidc/loginreturn", ...)
```

**HTTPS**

Veracity requires that your application supports HTTPS even when building locally. To aid in local development this library comes with a small utility that helps you create self-signed certificates. These certificates are **NOT** suitable for production code and should only be used for local development.

To utilize the utility you need to install `node-forge`. Run:
```javascript
npm i -D node-forge
```

Now you can set up an https server locally by requiring `https` and slightly modifying the startup file.

```javascript
const express = require("express")
const { MemoryStore } = require("express-session")
const {setupAuthFlowStrategy} = require("@veracity/node-auth/helpers")

const https = require("https")
const {generateCertificate} = require("@veracity/node-auth/utils/generateCertificate")

const app = express() // Create our app instance

setupAuthFlowStrategy({
	appOrRouter: app,	appOrRouter: app,
	loginPath: "/login",
	strategySettings: { // These settings comes from the Veracity for Developers application credential
		clientId: "", // Your client id
		clientSecret: "", // Your client secret
		replyUrl: "" // Your reply url
	},
	sessionSettings: {
		secret: "66530082-b48b-41f1-abf5-0987eb156652",
		store: new MemoryStore() // We use a memory store here for development purposes, this is not suitable for production code.
	}
})

app.get("/", (req, res) => {
	res.send(req.user) // Log the user object for debugging purposes
})

const server = https.createServer({
	...generateCertificate() // Here we generate the certificates and pass them to nodes https server.
}, app) // We add app as the handler for all requests incomming on the server
server.on("error", (error) => {
	console.error(error)
	process.exit(1)
})
server.listen(3000, () => { // And finally start listening for connections
	console.log("Listening for connections on port 3000")
})
```

You should now have a locally running express server that supports Veracity Authentication

### Using the passport strategy directly
If your application has more complex requirements or you find you are unable to get stuff running the way you want to using `setupAuthFlowStrategy` you can set up the passport strategy yourself. This requires more steps but gives you much greater control over the process.

Provided you have a [Connect](https://github.com/senchalabs/connect) compatible library powering your application (ExpressJS is Connect compatible) the library should not require any specific dependencies. However, you are required to provide functionality equivalent to the following dependencies:
`express-session` and `body-parser`. The former exposes persistent session storage on `req.session` while the latter allows parsing of form post data and the result be placed on `req.body`.

Start by installing the required dependencies
```javascript
npm i passport @veracity/node-auth
```

Optionally install express, express-session and body-parser if you do not have other libraries fulfilling these functions
```javascript
npm i express express-session body-parser
```

You should set up your application as needed, make sure sessions are supported. Once done you can configure the Veracity strategy like this (assuming your connect compatible application is available on the variable `app`):
```javascript
// Require passport
const passport = require("passport")

// Body parser is used to parse the response from the Veracity IDP. If you have an equivalent library you can use that instead.
const bodyParser = require("bodyParser")

// Register passports middleware in our application
app.use(passport.initialize())
app.use(passport.session())

// Set up configurations for the strategy
// These settings come from your application credentials
const strategySettings = {
	clientId: ""
	clientSecret: ""
	replyUrl: ""
}
// Create our verifier function
const onVerify = (options, done) => {
	done(null, options) // Simply pass through all options
}

// Create the strategy instance and register it with passport using the name "veracity"
passport.use("veracity", new VeracityAuthFlowStrategy(strategySettings, onVerify))

// Set up serialize and deserialize. This will simply store the entire user object in session.
passport.serializeUser((user, done) => { done(null, user) })
passport.deserializeUser((id, done) => { done(null, id) })
```

Now that the configuration is complete you can set up the endpoints needed for authentication
```javascript
// Set up the endpoint that will begin logging in the user
app.get("/login", passport.authenticate("veracity"))

// Set up the return endpoint the user is redirected back to after logging in
// This must match the path section of the reply url you configured above e.g.: /auth/oidc/loginreturn
app.post("[path section of replyUrl]", bodyParser.urlencoded({extended: true}), passport.authenticate("veracity"), (req, res) => {
	res.redirect("/") // This is called once login has completed. Routes the user back to the root of the application
})
```

Your application should now be configured to authenticate with Veracity.

## Authentication process
The authentication process used by Veracity is called *Open ID Connect* with token negotiation using *Authorization Code Flow*. Behind the scenes, Veracity relies on Microsoft Azure B2C to perform the actual login. You can read more about the protocol on [Microsoft's website](https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-openid-connect-code).

This library provides you with a *strategy* that you can use to perform authentication. The technicalities of the protocol are then handled by the library and you can focus on utilizing the resulting tokens to call APIs and build cool applications.

## API

### VeracityAuthFlowStrategy
```javascript
passport.use("veracity", new VeracityAuthFlowStrategy(options, verifier))
```

**options**

- `tenantId`: Default: `a68572e3-63ce-4bc1-acdc-b64943502e9d` The id of the Veracity IDP. You probably do not need to change this.
- `policy`: Default: `B2C_1A_SignInWithADFSIdp` Describes the way you want to authenticate. You probably do not need to change this.
- `clientId`: This is your applications client id. Use the [Veracity for Developers](https://developerdevtest.veracity.com/projects) portal to create this.
- `clientSecret`: This is your applications client secret. Use the [Veracity for Developers](https://developerdevtest.veracity.com/projects) portal to create this.
- `replyUrl`: The URL users are redirected back to after logging in. You can configure this in the [Veracity for Developers](https://developerdevtest.veracity.com/projects) portal.
- `requestRefreshToken`: Default `true`. Set this to true if you want to retrieve a refresh token along with each access token you want. Refresh tokens allow you to request new access tokens once they expire.
- `apiScopes`: Defaults to scope for Veracity Services API. This is where you configure which scopes you want to acquire access tokens for when users log in. You can specify zero or more scopes depending on your need. If you do not need to call any of the Veracity APIs, but simply wish to use Veracity for authentication set this to an empty array.

**verifier**

The verifier function is commonly used by `passport` to look up the user and verify that they are registered with the system. Since you are using Veracity as your Identity Provider you can assume that if this function is called the user is indeed registered and valid. Instead you may use this function to augment the user object with data from other internal systems or databases.

- `options`: The options object contains the id token and every access token the authentication process received. 
- `done()`: This is the done function from `passport` that you must call to tell passport that authentication has completed.
- `req`: The request object from express for this specific request.

The verifier can be synchronous or asynchronous.

```javascript
const verifier = (options, done) => {
	const {idTokenDecoded} = options
	const {given_name, family_name} = idTokenDecoded
	done(null, {
		...options,
		fullName: `${family_name}, ${given_name}`
	})
}

const verifier = async (options, done) => {
	const {idTokenDecoded} = options
	const additionalData = await lookupMoreDetails(idTokenDecoded.myDnvglGuid)
	done(null, {
		...options,
		...additionalData
	})
}
```

### Verifier options
The options object given to the verifier function gives you access to all the data necessary to call protected APIs and display some basic user information.

- `idToken`: The full ID token as a string.
- `idTokenDecoded`: The decoded ID token payload with all claims. Here you find the user's information.
- `apiTokens`: An object indexed by API scope strings containing every access token as well as additional information such as expire time and refresh token (if applicable). This object will not be present if you do not specify any API scopes in the strategy settings.

For a list of all returned claims in the ID and access tokens, see the file `veracityTokens.ts` in the `interfaces` folder.

**setupAuthFlowStrategy options**
- `appOrRouter`: The express application instance or router you wish to configure.
- `loginPath`: The path in your application users should visit to log in.
- `strategySettings`: The settings for VeracityAuthFlowStrategy (see above)
- `sessionSettings`: Settings for the express-session middleware. See [express-session](https://github.com/expressjs/session) for details
- `onBeforeLogin`: An express route handler that is run before the login process begins. It MUST call next() or the login process will not proceeed.
- `onVerify`: The verify callback for the strategy. It is called once all tokens have been retrieved and allows you to configure what should be stored on `req.user`. This method supports promises so you may also make lookups in other systems to augment the user object as needed. The default handler will pass all data from the authentcation over to `req.user`.
- `onLoginComplete`: An express route handler that is run after the login completes. Here you may redirect the user, display a page or inspect the query parameters from the original login request. They will have been restored on `req.query` automatically.

## Error handling
Any error that occurs within a strategy provided by this library will be an instance of a `VIPDError`. VIDPError objects are extensions of regular Error objects that contain additional information about what type of error occured. Using this information you can decide how to proceed.

VIDPError objects expose a `details` property that contains:
- `error`: The error code for this error (see the complete list below)
- `description`: A textual description of the error
- `innerError`: Certain errors such as token validation errors will contain an inner error from the validation library. You can inspect this for more details.

Should an error occur during the authentication process it will be passed to next() just like other errors in Connect-compatible applications like ExpressJS. You should handle these errors according to the documentation from your library of choice. You can find more information on error handling in [Connect here](https://github.com/senchalabs/connect#error-middleware) and [ExpressJS here](https://expressjs.com/en/guide/error-handling.html).

```javascript
// Register an error handler in your application
app.use((err, req, res, next) => {
	if (err instanceof VIDPError) { // This is an error that occured with the Veracity Authentication strategy
		// Check err.details.error for the type and act accordingly
	}
})
```

### Error types:
The `error` property of the VIDPError object defines the type of error that has occurred.

These types may be thrown by the IDP server:
-	`invalid_request`: There was a formatting error in the request to the IDP server. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).
- `unauthorized_client`: Your client id, secret or reply url may be incorrect.
- `access_denied`: The client application can notify the user that it cannot proceed unless the user consents.
- `unsupported_response_type`: The request to the server requested an unsupported response type. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).
- `server_error`: An error occurred on the server side. You should retry the request.
- `temporarily_unavailable`: The server may be overloaded or slow. You should retry the request later.
- `invalid_resource`: The resource requested does not exist. Check your api scopes.

These types are thrown by the library:
- `setting_error`: One or more required settings are invalid or missing. Check your configuration file.
- `missing_dependency`: A dependency (such as `passport`) is missing. Install the missing dependency.
- `unknown_response`: The response from the IDP was not what was expected. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).
- `response_validation_error`: The response from the IDP was invalid. Most likely due to the state being invalid. This may be due to something changing the request or response in flight.
- `authcode_validation_error`: Failed to validate the id token or authorization code. This may be due to something changing the request or response in flight.
- `accesstoken_validation_error`: Failed to validate the id token or access token. This may be due to something changing the request or response in flight.
- `unknown_error`: This error occurs if the library does not know how to categorize the error. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).

If you observe an error code that is not in the list above [please open an issue](https://github.com/veracity/node-auth/issues) on our GitHub page.
