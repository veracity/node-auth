# Veracity Authentication library for NodeJS
This library provides utilities that help with authentication against the Veracity Identity Provider.

**Current features**
- Authentication Strategy for PassportJS that performs Authorization Code flow authentication and token exchange for zero or more API tokens.
- Helper for configuring express, express-session and passport with the strategy.

It is highly recommended that you use a TypeScript aware IDE when using this library as much of the documentation is in the form of interfaces. Such IDEs can show detailed documentation as you work making it easier to use this library correctly. We suggest [Visual Studio Code](https://code.visualstudio.com/). The library **does not** require that you write your application using TypeScript.

# Table of contents
⭐ New in the latest version

<!-- toc -->

- [Quick Start](#quick-start)
  * [Using the helper function](#using-the-helper-function)
  * [Using the passport strategy](#using-the-passport-strategy)
- [Passing state](#passing-state)
- [Authentication process](#authentication-process)
- [API](#api)
  * [VeracityAuthFlowStrategy](#veracityauthflowstrategy)
  * [Refresh tokens](#refresh-tokens)
  * [Logging out](#logging-out)
  * [Verifier / onVerify](#verifier--onverify)
- [Data structures](#data-structures)
  * [IMakeSessionConfigObjectOptions](#imakesessionconfigobjectoptions)
  * [ISetupAuthFlowOptions](#isetupauthflowoptions)
  * [IVeracityAuthFlowStrategySettings](#iveracityauthflowstrategysettings)
  * [IVeracityAuthFlowStrategyVerifierOptions](#iveracityauthflowstrategyverifieroptions)
  * [IVeracityTokenData](#iveracitytokendata)
  * [ICommonClaims](#icommonclaims)
  * [IVeracityTokenHeader](#iveracitytokenheader)
  * [IVeracityIDTokenPayload](#iveracityidtokenpayload)
  * [IVeracityAccessTokenPayload](#iveracityaccesstokenpayload)
  * [IVeracityIDToken](#iveracityidtoken)
  * [IVeracityAccessToken](#iveracityaccesstoken)
- [Error handling](#error-handling)
  * [Error types](#error-types)

<!-- tocstop -->

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

The helper function will automatically register three response handlers on your application.
```javascript
const settings = {
	// ... other settings are omitted for brevity
	loginPath: "/login",
	logoutPath: "/logout",
	strategySettings: {
		replyUrl: "https://localhost:3000/auth/oidc/loginreturn"
	}
}

app.get(settings.loginPath, ...) // A GET handler on the "loginPath" setting to begin authentication
app.get(settings.logoutPath, ...) // A GET handler on the "logoutPath" setting to log the user out. Uses the strategy instances "logout" method to log the user out.
app.post(settings.strategySettings.replyUrl, ...) // A POST handler on the *path segment* of the replyUrl. It handles users returning from the login page.

// These are the equivalent paths when written out
app.get("/login", ...)
app.get("/logout", ...)
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
const {setupAuthFlowStrategy, generateCertificate} = require("@veracity/node-auth/helpers")

const https = require("https")

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
}
// new VeracityAuthFlowStrategy(ISetupAuthFlowOptions<TUser>)
setupAuthFlowStrategy(settings)

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

### Using the passport strategy
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

const { VeracityAuthFlowStrategy } = require("@veracity/node-auth")

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
// new VeracityAuthFlowStrategy(IVeracityAuthFlowStrategySettings, VerifierFunction<TUser>)
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

## Passing state
Sometimes it is useful to be able to pass data from before the login begins all the way through the authentication process until control is returned back to your code. This library supports this in two ways:

1. Any query parameters sent to the login handler are mirrored onto the request object when the login completes. This means you can inspect `req.query` in the POST handler (or `onLoginComplete`) when the authentication completes and see the same ones that were sent to the login request.
2. You can modify the request object in a handler before beginning the authentication process by adding data to the `veracityAuthState` property. Any data found here will be mirrored onto the final request object once the login completes. The data should be small and must be JSON serializable.

Using query parameter passthrough
```javascript
// With setupAuthFlowStrategy you only need to provide a custom onLoginComplete handler
const settings = {
	// ... other options omitted for brevity
	onLoginComplete: (req, res) => {
		if (req.query.dumpData) { // Inspect the query parameters as they were sent and act on them
			res.send(req.user)
		}
		res.redirect("/")
	}
}


// With the strategy you can inspect the request object directly as in any other handler
app.post("[path section of replyUrl]", bodyParser.urlencoded({extended: true}), passport.authenticate("veracity"), (req, res) => {
	if (req.query.dumpData) { // Inspect the query parameters as they were sent and act on them
		res.send(req.user)
	}
	res.redirect("/")
})
```

Using `veracityAuthState`
```javascript
// With setupAuthFlowStrategy you need to specify the onBeforeLogin handler
const settings = {
	// ... other options omitted for brevity
	onBeforeLogin: (req, res, next) => {
		req.veracityAuthData = { // Set some options on the veracityAuthData object
			loginBegan: Date.now()
		}
		next() // This handler MUST call next
	}
	onLoginComplete: (req, res) => {
		// We can now use the data we set before logging in
		res.send(`Login duration ${Date.now() - req.veracityAuthData.loginBegan} in ms`)
	}
}

// With the strategy you need to provide a middleware on the login endpoint
app.get("/login", (req, res, next) => {
	req.veracityAuthData = { // Set some options on the veracityAuthData object
		loginBegan: Date.now()
	}
	next()
}, passport.authenticate("veracity"))

app.post("[path section of replyUrl]", bodyParser.urlencoded({extended: true}), passport.authenticate("veracity"), (req, res) => {
	// We can now use the data we set before logging in
	res.send(`Login duration ${Date.now() - req.veracityAuthData.loginBegan} in ms`)
})
```

## Authentication process
The authentication process used by Veracity is called *Open ID Connect* with token negotiation using *Authorization Code Flow*. Behind the scenes, Veracity relies on Microsoft Azure B2C to perform the actual login. You can read more about the protocol on [Microsoft's website](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc).

This library provides you with a *strategy* that you can use to perform authentication. The strategy is compatible with PassportJS and allows any Connect-compatible library to authenticate with Veracity. The technicalities of the protocol are then handled by the library and you can focus on utilizing the resulting tokens to call APIs and build cool applications.

## API

### VeracityAuthFlowStrategy
```javascript
// new VeracityAuthFlowStrategy(IVeracityAuthFlowStrategySettings, VerifierFunction<TUser>)
const strategy = new VeracityAuthFlowStrategy(settings, verifier)
passport.use("veracity", strategy)
```

### Refresh tokens
Access tokens will expire after a short while so your code needs to take this into account and potentially refresh the token before using it to call secure endpoints. You can do this manually if you'd like, but to aid with this process the `VeracityAuthFlowStrategy` instance provides a few helper functions for refreshing access tokens.

If you want to handle token refresh on your own you can read about the protocol [here](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc#refresh-the-token).

**Refresh tokens with middleware**

The easiest way to refresh tokens is to use the middleware helper method `refreshTokenMiddleware` on the `VeracityAuthFlowStrategy` instance. This middleware can be dropped into any request handler chain and will automatically refresh the access token on demand (if the refresh token has not expired).

You need to have three things in order to configure the refresh token middleware:
- `newTokenHandler` - A handler function that receives the new access token data and should decide what to do with it. Here you will usually update the user object on `req.user` with the new token.
- `refreshStrategy` - A function that determines whether the token should be refreshed or not. If not provided the token will be refreshed if its remaining lifetime is less than half of its total lifetime.
- `tokenApiScopeOrResolver` - The token refresh middleware needs to find the actual token to refresh. If your code uses the standardized apiTokens object on `req.user` you can simply specify the api scope url here. Otherwise you will need to provide a function that returns the token data.

```javascript
// Provided your user object is structured like this:
/*
req.user = {
	apiTokens: {
		"https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation": {
			...token data
		}
	}
}
*/
// You can pass the scope name and the refresh handler will resolve the token automatically

// Create the strategy instance
const strategy = new VeracityAuthFlowStrategy(options, verifier)
// or
const strategy = setupAuthFlowStrategy({
	// config
})

// Define a token handler that updates the user object.
// Notice that we UPDATE req.user and do not replace it with a new one
// This ensures that express-session will persist the new data
const newTokenHandler = (tokenData, req) => {
	req.user.apiTokens[tokenData.scope] = tokenData
}

// We can now create a factory function that can refresh any of our tokens
const refreshTokenMiddleware = strategy.refreshTokenMiddleware(newTokenHandler)

// On an endpoint that calls a secure api we can add the refresh handler the middleware
// chain to ensure the token is updated (if needed) before our handler is called 
app.get("/api-call", refreshTokenMiddleware("https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"), (req, res) => {
	// Call secure api with token
})
```

**Refresh tokens with direct token data**
If you do not wish to use the middleware you can get the refreshed token directly and handle the wrapping yourself. To do this you would call the `getRefreshedToken` method on your `VeracityAuthFlowStrategy` instance. This method takes a `IVeracityTokenData` object and returns a new object with a new id and access token.

```javascript
// Create the strategy instance
const strategy = new VeracityAuthFlowStrategy(options, verifier)
// or
const strategy = setupAuthFlowStrategy({
// config
})

// Create an endpoint where tokens can be refreshed
app.get("/refreshToken/:scope", async (req, res, next) => {
	try {
		// Get the old token data, this assumes the tokens are stored as IVeracityTokenData objects
		const oldTokenData = req.user.apiTokens[req.params.scope]

		// Fetch new token data and store the result.
		req.user.apiTokens[req.params.scope] = await strategy.refreshToken(oldTokenData)

		 // Tell the user everything is fine
		res.send(ok)
	} catch (error) {
		next(error) // If an error occurs pass it to the connect error handler
	}
})
```
Using the `getRefreshedToken` method allows you to construct any kind of logic you may need around the process, but in most cases it is probably sufficient to simply use the middleware.

### Logging out
Logging out users is a relatively simple process: Ensure the users tokens are removed and redirect them to the central logout page. The last step is required by Veracity in order to ensure the user is logged out properly.

The `VeracityAuthFlowStrategy` provides a helper for signing users out that, conveniently, also works as a drop in middleware. If you are using the `setupAuthFlowStrategy` helper function it will register a logout handler for you on the logoutUrl you specify so there is no need to do anything else.

```javascript
// Create the strategy instance
const strategy = new VeracityAuthFlowStrategy(options, verifier)

// You can use the logout method directly as a middleware
app.get("/logout", strategy.logout)

// Or you can call it while performing your own logic
app.get("/logout", (req, res) => {
	// Do your own logic here

	// Finally call logout. It will redirect the user to the proper logout endpoint.
	strategy.logout(req, res)
})
```

### Verifier / onVerify
The verifier function is commonly used by `passport` to look up the user and verify that they are registered with the system. Since you are using Veracity as your Identity Provider you can assume that if this function is called the user is indeed registered and valid. Instead you may use this function to augment the user object with data from other internal systems or databases.

The verifier is passed as the second argument to the strategy or, if you are using the helper `setupAuthFlowStrategy` as the `onVerify` option.

- `options` - The options object contains the id token and every access token the authentication process received. 
- `done()` - This is the done function from `passport` that you must call to tell passport that authentication has completed.
- `req` - The request object from express for this specific request.

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

## Data structures
⭐️

The library makes use of several data structures. They are all defined as TypeScript interfaces that will be visible in any TypeScript aware editor. Below is an export of all public types.

<!-- types -->
### IMakeSessionConfigObjectOptions


Property|Type|Description
-|-|-
secret|string|A unique string that is used to sign the session id. This MUST NOT be shared with any other application.
store|Store \| MemoryStore|A store instance where session data will be stored. You MUST provide this otherwise express-session will default to using the insecure memory store.

### ISetupAuthFlowOptions
*<TUser = any>* 

Property|Type|Description
-|-|-
appOrRouter|Router|Required to attach passport and session middleware as well as setting up your authentication routes. Usually this is an express application instance, but a router is also supported.
loginPath?<br>="/login"|string|Specify the url path where users can log in. E.g.: /auth/login
logoutPath?<br>="/logout"|string|Specify the url path where users can log out
strategySettings|IVeracityAuthFlowStrategySettings,|Define all required settings to set up the Veracity authentication strategy.
sessionSettings|IMakeSessionConfigObjectOptions|Define required settings for the session middleware.
onBeforeLogin?<br>=function Passthrough function|RequestHandler|A handler that is run before the login process begins. Note that this handler MUST call next() in order to continue the login process.
onVerify?<br>=function Passthrough that stores everything|VerifierFunction<TUser>|A function that is called once the user has completely logged in. Here you can specify how the user object will look when it's attached to req.user
onLoginComplete?<br>=function|RequestHandler|The handler to call when the login has completed. Defaults to handler that redirects you to whatever was sent in the returnTo query parameter on login or to "/".

### IVeracityAuthFlowStrategySettings


Property|Type|Description
-|-|-
tenantId?<br>="a68572e3-63ce-4bc1-acdc-b64943502e9d"|string|The id of the Veracity tenant you are authenticating with.
policy?<br>="B2C_1A_SignInWithADFSIdp"|string|The name of the authenication policy.
logoutRedirectUrl?<br>="https://www.veracity.com/auth/logout"|string|Where to redirect the user after logging out. You should not set this unless you know what you're doing
clientId|string|The client id from the Application Credentials you created in the Veracity for Developers Provider Hub
clientSecret|string|The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub
replyUrl|string|The reply url from the Application Credentials you created in the Veracity for Developers Provider Hub
requestRefreshTokens?<br>=true|boolean|If true retrieves a refresh token for each api scope in addition to the access token.
apiScopes?<br>=["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"]|string[]|The scopes you wish to authenticate with. An access token will be retrieved for each api scope. If you only wish to authenticate with Veracity you can ignore this setting.

### IVeracityAuthFlowStrategyVerifierOptions


Property|Type|Description
-|-|-
idToken|string|The full ID token
idTokenDecoded|IVeracityIDTokenPayload|The decoded ID token payload (header and signature not included)
apiTokens?|{[scope: string]: IVeracityTokenData}|Contains all access tokens and associated refresh tokens negotiated by the system. Tokens are indexed by the scope string. If no api scopes were provided in the strategy settings this will not be defined.

### IVeracityTokenData


Property|Type|Description
-|-|-
scope|string|The associated scope of this token.
idToken|string|The id token returned along with the authorization code used to retrieve this access token.
idTokenDecoded|IVeracityIDTokenPayload|The decoded id token (header and signature not included).
accessToken|string|The full access token.
accessTokenDecoded|IVeracityAccessTokenPayload|The decoded access token payload (header and signature not included).
accessTokenIssued|number|The timestamp when the access token was issued.
accessTokenExpires|number|The timestamp when the access token expires.
accessTokenLifetime|number|The lifetime of the access token in seconds.
refreshToken?|string|The opaque refresh token if offline_access scope was provided.
refreshTokenExpires?|number|The timestamp when the refresh token expires if refresh token is present.

### ICommonClaims


Property|Type|Description
-|-|-
iss|string|
sub|"Not supported currently. Use oid claim."|
aud|string|
exp|number|
nbf|number|
iat|number|
email|string[]|
nonce|string|
given_name|string|
family_name|string|
name|string|
ver|"1.0"|

### IVeracityTokenHeader


Property|Type|Description
-|-|-
typ|string|
alg|string|
kid|string|

### IVeracityIDTokenPayload
*extends ICommonClaims*

Property|Type|Description
-|-|-
c_hash?|string|Hash of the Authorization code. Only present if request was for an authorization code.
at_hash?|string|Hash of the access token. Only present if request was for an access token.
acr|string|
auth_time|number|
userId|string|
dnvglAccountName|string|
myDnvglGuid|string|
oid|string|
upn|string|

### IVeracityAccessTokenPayload
*extends ICommonClaims*

Property|Type|Description
-|-|-
azp|string|
userId|string|
dnvglAccountName|string|
myDnvglGuid|string|
oid|string|
upn|string|
scp|string|

### IVeracityIDToken


Property|Type|Description
-|-|-
header|IVeracityTokenHeader|
payload|IVeracityIDTokenPayload|
signature|string|

### IVeracityAccessToken


Property|Type|Description
-|-|-
header|IVeracityTokenHeader|
payload|IVeracityAccessTokenPayload|
signature|string|

<!-- /types -->

## Error handling
Any error that occurs within a strategy provided by this library will be an instance of a `VIPDError`. VIDPError objects are extensions of regular Error objects that contain additional information about what type of error occured. Using this information you can decide how to proceed.

VIDPError objects expose a `details` property that contains:
- `error` - The error code for this error (see the complete list below)
- `description` - A textual description of the error
- `innerError` - Certain errors such as token validation errors will contain an inner error from the validation library. You can inspect this for more details.
- `idToken` - ⭐️Contains the raw ID token if one was available. You can decode this to view all user information.

Should an error occur during the authentication process it will be passed to next() just like other errors in Connect-compatible applications like ExpressJS. You should handle these errors according to the documentation from your library of choice. You can find more information on error handling in [Connect here](https://github.com/senchalabs/connect#error-middleware) and [ExpressJS here](https://expressjs.com/en/guide/error-handling.html).

```javascript
const { VIDPError } = require("@veracity/node-auth")

// Register an error handler in your application
app.use((err, req, res, next) => {
	if (err instanceof VIDPError) { // This is an error that occured with the Veracity Authentication strategy
		// Check err.details.error for the type and act accordingly
	}
})
```

### Error types
The `error` property of the VIDPError object defines the type of error that has occurred.

These types may be thrown by the IDP server:
-	`invalid_request` - There was a formatting error in the request to the IDP server. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).
- `unauthorized_client` - Your client id, secret or reply url may be incorrect.
- `access_denied` - The client application can notify the user that it cannot proceed unless the user consents.
- `unsupported_response_type` - The request to the server requested an unsupported response type. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).
- `server_error` - An error occurred on the server side. You should retry the request.
- `temporarily_unavailable` - The server may be overloaded or slow. You should retry the request later.
- `invalid_resource` - The resource requested does not exist. Check your api scopes.

These types are thrown by the library:
- `setting_error` - One or more required settings are invalid or missing. Check your configuration file.
- `missing_dependency` - A dependency (such as `passport`) is missing. Install the missing dependency.
- `unknown_response` - The response from the IDP was not what was expected. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).
- `response_validation_error` - The response from the IDP was invalid. Most likely due to the state being invalid. This may be due to something changing the request or response in flight.
- `authcode_validation_error` - Failed to validate the id token or authorization code. This may be due to something changing the request or response in flight.
- `accesstoken_validation_error` - Failed to validate the id token or access token. This may be due to something changing the request or response in flight.
- `unsupported_context` - The function you attempted to use relies on the context (usually the `req` object) having some properties or being in a certain state. This error is thrown if the context is not in a supported state for the function you called.
- `token_expired` - This error is thrown if you perform an operation with an expired token. This can be utilizing a token through a helper or attempting to refresh an access token using an expired refresh token.
- `unknown_error` - This error occurs if the library does not know how to categorize the error. If this error occurs there may be a bug in the library. Please [open an issue](https://github.com/veracity/node-auth/issues).

If you observe an error code that is not in the list above [please open an issue](https://github.com/veracity/node-auth/issues) on our GitHub page.
