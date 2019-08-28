# Veracity Authentication library for NodeJS
This library provides utilities that help with authentication against the Veracity Identity Provider.

## NEW VERSION
Version `1.0.0-rc1` is the first release candidate. The API has been radically changed from version `0.3.1-beta` and is not backwards compatible. This documentation as been revamped to describe the new library. See the section [Upgrading to v1.0.0](#upgrading-to-v1.0.0) for details on what needs to be changed in order to support the latest version.

## Features
- Authentication strategies for PassportJS for web and native applications using the Veracity Identity Provider.
- Authentication strategy for access token validation for APIs.
- Helper for setting up authentication with Veracity as well as logout.
- Middleware for refreshing tokens using a token-refresh-strategy.
- API support for advanced scenarios without relying on passport at all.

## Table of contents

<!-- toc -->

- [Quick Start - web and native applications](#quick-start---web-and-native-applications)
  * [HTTPS](#https)
  * [Refresh tokens](#refresh-tokens)
  * [onVerify / Verifier](#onverify--verifier)
- [Passing state](#passing-state)
- [Error handling](#error-handling)
- [Authentication process](#authentication-process)
- [Logging out](#logging-out)
- [Data structures](#data-structures)
  * [ISetupWebAppAuthSettings](#isetupwebappauthsettings)
  * [IVIDPAccessTokenPayload](#ividpaccesstokenpayload)
  * [IVIDPAccessTokenData](#ividpaccesstokendata)
  * [IVIDPAccessToken](#ividpaccesstoken)
  * [IVIDPConfiguration](#ividpconfiguration)
  * [IVIDPWebAppConfiguration](#ividpwebappconfiguration)
  * [IVIDPIDTokenPayload](#ividpidtokenpayload)
  * [IVIDPIDTokenData](#ividpidtokendata)
  * [IVIDPTokenData](#ividptokendata)
  * [IVIDPWebAppStrategySettings](#ividpwebappstrategysettings)
  * [IVIDPJWTTokenHeader](#ividpjwttokenheader)
  * [IVIDPJWTTokenData](#ividpjwttokendata)
  * [IVIDPJWTTokenPayloadCommonClaims](#ividpjwttokenpayloadcommonclaims)
  * [IVIDPJWTToken](#ividpjwttoken)
  * [VIDPRequestErrorCodes](#vidprequesterrorcodes)
  * [VIDPAccessTokenErrorCodes](#vidpaccesstokenerrorcodes)
  * [VIDPTokenValidationErrorCodes](#vidptokenvalidationerrorcodes)
  * [VIDPStrategyErrorCodes](#vidpstrategyerrorcodes)
  * [VIDPRefreshTokenErrorCodes](#vidprefreshtokenerrorcodes)

<!-- tocstop -->

## Quick Start - web and native applications
The quickest way to get started with authenticating users in a web or native application is to use the relevant helper function. The helper functions make it easy to set up all the necessary endpoints on your express application as well as configuring passport to support the Veracity IDP.

First you must install the required dependencies:
```bash
npm i passport express express-session body-parser
npm i @veracity/node-auth
```

You will also need to register your application with Veracity in order to allow it to authenticate. This can be done by visiting the [Veracity for Developers project portal](https://developer.veracity.com/projects) and creating an Application. Once complete you should retrieve the following parameters:

- Client ID
- Client Secret (only if you are building a web application and not a native application)
- Reply URL

You can now set up authentication for a web application like this:
```javascript
const express = require("express")
const { MemoryStore } = require("express-session")
const { setupWebAppAuth, setupNativeAppAuth } = require("@veracity/node-auth")

const app = express() // Create our app instance

// The call is identical for a native application except you must remove the clientSecret parameter.
setupWebAppAuth({
	app, // Pass in our application
	strategy: { // These settings comes from the Veracity for Developers application credential
		clientId: "", // Your client id
		clientSecret: "", // Your client secret (not used when configuring a native application)
		replyUrl: "" // Your reply url
	},
	session: {
		secret: "66530082-b48b-41f1-abf5-0987eb156652",
		store: new MemoryStore() // We use a memory store here for development purposes, this is not suitable for production code.
	}
})

app.get("/", (req, res) => {
	res.send(req.user) // Log the user object for debugging purposes
})

app.listen(3000, () => { // See note on HTTPS below before trying this out
	console.log("Listening for connections on port 3000")
})
```

That's it. You should now be able to authenticate with Veracity using your application. It will automatically retrieve an access token for you for communicating with the Veracity Service API and store everything on the `req.user` object.

The helper function will automatically register three response handlers on your application.
```javascript
const options = {
	// ... other settings are omitted for brevity
	loginPath: "/login",
	logoutPath: "/logout",
	strategy: {
		replyUrl: "https://localhost:3000/auth/oidc/loginreturn"
	}
}

app.get(options.loginPath, ...) // A GET handler on the "loginPath" setting to begin authentication
app.get(options.logoutPath, ...) // A GET handler on the "logoutPath" setting to log the user out. Uses the strategy instances "logout" method to log the user out.
app.post(options.strategy.replyUrl, ...) // A POST handler on the *path segment* of the replyUrl. It handles users returning from the login page.

// These are the equivalent paths when written out
app.get("/login", ...)
app.get("/logout", ...)
app.post("/auth/oidc/loginreturn", ...)
```

### HTTPS

Veracity requires that your web application uses HTTPS even when building locally. To aid in local development this library comes with a small utility that helps you create self-signed certificates on-the-fly. These certificates are **NOT** suitable for production code and should only be used for local development.

To use the utility you need to install `node-forge`:
```javascript
npm i -D node-forge
```

Now you can set up an https server locally by requiring nodes `https` module and slightly modifying the startup file.

```javascript
const express = require("express")
const { MemoryStore } = require("express-session")
const { setupWebAppAuth, generateCertificate } = require("@veracity/node-auth")

const https = require("https")
const app = express() // Create our app instance

setupWebAppAuth({
	app,
	strategy: { // These settings comes from the Veracity for Developers application credential
		clientId: "", // Your client id
		clientSecret: "", // Your client secret
		replyUrl: "" // Your reply url
	},
	session: {
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

You should now have a locally running express server that supports Veracity Authentication over HTTPS.

### Refresh tokens
Often it is useful to maintain a user session for longer than the initial access token is valid for. To allow you to keep a session active Veracity provides the ability to ask for refresh tokens. These are long-lived tokens that can be used to request new access tokens should the existing ones become invalid. Using the helper function `setupWebAppAuth` will also provide you with a ready-made middleware that makes it simple to refresh access tokens as needed.

Provided you do not change the verification function so that the `req.user` object contains an `accessTokens` property with the relevant access token data it is trivial to set up the middleware for any endpoint that requires a valid access token.

Say you have a endpoint that queries the Veracity Services API. It needs to have a valid access token. You can use the refresh middleware provided by `setupWebAppAuth` to ensure that should the access token become invalid the middleware will refresh the token and update the user object before passing on exection to your handler.

```javascript
const { refreshTokenMiddleware } = setupWebAppAuth({
	app,
	strategy: { // These settings comes from the Veracity for Developers application credential
		clientId: "", // Your client id
		clientSecret: "", // Your client secret
		replyUrl: "" // Your reply url
	},
	session: {
		secret: "66530082-b48b-41f1-abf5-0987eb156652",
		store: new MemoryStore() // We use a memory store here for development purposes, this is not suitable for production code.
	}
})

app.get("/profile-data", refreshTokenMiddleware(VERACITY_API_SCOPES.services), (req, res) => {
	
})

### Using the passport strategy
If your application has more complex requirements or you find you are unable to get stuff running the way you want to using `setupWebAppAuth` you can set up the passport strategy yourself. This requires more steps but gives you much greater control over the process. The strategy is also the same whether you are building a web or native application.

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

const { VIDPOpenIDCStrategy } = require("@veracity/node-auth")

// Register passports middleware in our application
app.use(passport.initialize())
app.use(passport.session())

// Set up configurations for the strategy
// These settings come from your application credentials
const strategySettings = {
	clientId: ""
	clientSecret: "" // This is not required if you are authenticating a native application
	replyUrl: ""
}
// Create our verifier function
const onVerify = (tokenData, req, done) => {
	done(null, tokenData) // Simply pass through all token data
}

// Create the strategy instance and register it with passport using the name "veracity"
// new VeracityAuthFlowStrategy(IVeracityAuthFlowStrategySettings, VerifierFunction<TUser>)
passport.use("veracity", new VIDPOpenIDCStrategy(strategySettings, onVerify))

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
app.post("[path of replyUrl]", bodyParser.urlencoded({extended: true}), passport.authenticate("veracity"), (req, res) => {
	res.redirect("/") // This is called once login has completed. Routes the user back to the root of the application
})
```

Your application should now be configured to authenticate with Veracity.

### onVerify / Verifier
This library helps you perform authentication with Veracity and returns user information as well as any requested access tokens. But often it is useful to be able to look up additional user information and augment the `req.user` object with it so that your application may use it later. You can do this before every request to your server, but that may take time and cost resources and you may not need to re-fetch this information multiple times after the user is logged in. To facilitate doing such operations `passport` provides the ability to pass a `verifier` function. It is meant to ensure the user is valid and optionally augment it with more data. Since the Veracity IDP + this library already has verified the user for you, you may use this function to query other services, modify the user object or do other such operations during the login process.

**Why not do this in onLoginComplete?** The verifier function is the "correct" place to perform additional lookups about the user. Allthough there is nothing technically wrong with doing it within the `onLoginComplete` function this will mix up the "intent" of the function. The verifier is meant to verify and augment the user object while `onLoginComplete` is a plain middleware meant to route the user to the next logical step in their login process.

The `verifier` function is called with three arguments: `tokenData`, `req` and `done`:

Argument|Description
-|-
`tokenData`|An object matching the [IVIDPTokenData](#IVIDPTokenData) interface with an id token and all requested access tokens.
`req`|The request object for the returned post request from the Veracity IDP
`done`|The `passport` done function. It takes two arguments `error` and `user` in that order. For a successful verification call `done(null, user)` with the user object you want to place on `req.user`. For errors call `done(error)` to pass the error to the error handling mechanism in the strategy. It will be wrapped in a `VIDPError` object and sent to any registered error handler on the router where the strategy is connected.

In many cases it is sufficient to simply pass through the tokenData object as the user object. This is in fact what the authentication helper functions do for you by default. But you can also perform synchronous or asynchronous operations within the verifier to add information as needed.

With the helper functions you can simply pass an async `onVerify` function to perform additional asynchronous lookups.
```javascript
setupWebAppAuth({
	// ... other settings omitted
	onVerify: async (tokenData, req, done) => {
		// Look up the user profile from another service based on the user id 
		const profile = await getUserProfile(tokenData.idToken.payload.userId)

		// Add profile info to the user object which will be placed on `req.user`
		done(null, {
			...tokenData,
			profile
		})
	}
})
```

The code for the verifier function is identical if you are using the strategy directly. The only difference is where you pass the function in.
```javascript
// Create our verifier function
const verifier = async (tokenData, req, done) => {
	// Look up the user profile from another service based on the user id 
	const profile = await getUserProfile(tokenData.idToken.payload.userId)

	// Add profile info to the user object which will be placed on `req.user`
	done(null, {
		...tokenData,
		profile
	})
}

// Create the strategy instance and register it with passport using the name "veracity"
// new VeracityAuthFlowStrategy(IVeracityAuthFlowStrategySettings, VerifierFunction<TUser>)
passport.use("veracity", new VIDPOpenIDCStrategy(strategySettings, verifier))
```

## Passing state
Sometimes it is useful to be able to pass data from before the login begins all the way through the authentication process until control is returned back to your code. This library supports this in two ways for web and native applications (the bearer token validation strategy does not support this):

1. Any query parameters sent to the login handler are mirrored onto the request object when the login completes. This means you can inspect `req.query` in the POST handler (or `onLoginComplete`) when the authentication completes and see the same ones that were sent to the login request. Returning query parameters from Veracity IDP will take presedence.
2. You can modify the request object in a handler before beginning the authentication process by adding data to the `veracityAuthState` property. Any data found here will be mirrored onto the final request object once the login completes. `req.veracityAuthState` before login will equal `req.veracityAuthState` after login.

To pass state using the helper functions for web and native applications you simply provide an `onBeforeLogin` and an `onLoginComplete` function to set the state and read the state respectively. Since query parameters are always mirrored if you only want to use those you do not need to provide an `onBeforeLogin` function at all.
```javascript
// Setup is identical for setupNativeAppAuth
setupWebAppAuth({
	// ... other settings are omitted for brevity
	onBeforeLogin: (req, res, next) => {
		req.veracityAuthState = {
			loginBeganAt: Date.now()
		}
		next() // You **MUST** call next in your onBeforeLogin handler in order to continue the login process.
	},
	onLoginComplete: (req, res, next) => {
		// log login duration
		console.log("Login took (ms)", Date.now() - req.veracityAuthState.loginBeganAt)

		// Redirect to the specified returnTo path from before the login began or to home if not provided.
		res.redirect(req.query.returnTo || "/")
	}
})
```

When using the passport strategy directly you can do the same thing by inserting your own middleware in the authentication chain, which is basically what the setup helper functions do anyway.
```javascript
app.get("/login", (req, res, next) => {
	req.veracityAuthState = {
		loginBeganAt: Date.now()
	}
	next()
}, passport.authenticate("veracity"))

app.post(
	"[path of replyUrl]",
	bodyParser.urlencoded({extended: true}),
	passport.authenticate("veracity"),
	(req, res) => {
		// log login duration
		console.log("Login took (ms)", Date.now() - req.veracityAuthState.loginBeganAt)

		// Redirect to the specified returnTo path from before the login began or to home if not provided.
		res.redirect(req.query.returnTo || "/")
	}
)
```

## Error handling
Any error that occurs within a strategy provided by this library (or by extension a helper function) will be an instance of a `VIPDError`. VIDPError objects are extensions of regular Error objects that contain additional information about what type of error occured. Using this information you can decide how to proceed.

The properties of a `VIDPError` object are:
Property|Type|Description
-|-|-
code|string|A unique code for this error corresponding to an error code from any of the *ErrorCodes interfaces (see below).
description|string|A more detailed description of the error useful for debugging.
source|string|A source for where the error occured within the library.
details?|any|An object defining more details about the error in a machine readable format.
innerError?|Error|If this error instance was created based on another error this property will contain that specific error instance.

Should an error occur during any part of the authentication process it will be passed to next() just like other errors in Connect-compatible applications like ExpressJS. You should handle these errors according to the documentation from your library of choice. You can find more information on error handling in [Connect here](https://github.com/senchalabs/connect#error-middleware) and [ExpressJS here](https://expressjs.com/en/guide/error-handling.html).

```javascript
const { VIDPError } = require("@veracity/node-auth")

// Register an error handler in your application
app.use((err, req, res, next) => {
	if (err instanceof VIDPError) { // This is an error that occured with the Veracity Authentication strategy
		// Check err.details.error for the type and act accordingly
	}
})
```

## Authentication process
The authentication process used by Veracity is called *Open ID Connect* with token negotiation using *Authorization Code Flow*. Behind the scenes, Veracity relies on Microsoft Azure B2C to perform the actual login. You can read more about the protocol on [Microsoft's website](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow).

This library provides you with a *strategy* that you can use to perform authentication. The strategy is compatible with PassportJS and allows any Connect-compatible library to authenticate with Veracity. The technicalities of the protocol are then handled by the library and you can focus on utilizing the resulting tokens to call APIs and build cool applications.

## Logging out
Logging out users is a relatively simple process. Your application is storing session information (user data including access tokens) within some kind of session storage. This must be removed. Then you need to redirect users to the sign out page on Veracity to centrally log them out. This last step is required by Veracity to adhere to security best-practices.

The URL on Veracity where you should direct users logging out is stored as a constant in this library:
```javascript
const { VERACITY_LOGOUT_URL } = require("@veracity/node-auth")

app.get("/logout", (req, res) => {
	req.logout()
	res.redirect(VERACITY_LOGOUT_URL)
})
```

## Data structures
⭐️

The library makes use of several data structures. They are all defined as TypeScript interfaces that will be visible in any TypeScript aware editor. Below is an export of all public types.

<!-- types -->

### ISetupWebAppAuthSettings


Property|Type|Description
-|-|-
name?|string|An optional name for the strategy when registering with passport.
app|Router|The express application to configure or the router instance.
session|IMakeSessionConfigObjectOptions|Session configuration
strategy|IVIDPWebAppStrategySettings|Configuration for the strategy you want to use.
loginPath?|string|The path where login will be configured
logoutPath?|string|The path where logout will be configured
onBeforeLogin?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void|Provide a function that executes before the login process starts.<br>It executes as a middleware so remember to call next() when you are done.
onVerify?|VIDPWebAppStrategyVerifier|The verifier function passed to the strategy.<br>If not defined will be a passthrough verifier that stores everything from the strategy on `req.user`.
onLoginComplete?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void,|A route handler to execute once the login is completed.<br>The default will route the user to the returnTo query parameter path or to the root path.
onLoginError?|(error: VIDPError, req: Request, res: Response, next: NextFunction) => void|An error handler that is called if an error response is received from the Veracity IDP authentication redirect.<br>If not defined will pass the error on to the default error handler in the app or router.

### IVIDPAccessTokenPayload
*extends IVIDPJWTTokenPayloadCommonClaims*

Property|Type|Description
-|-|-
azp|string|
userId|string|The users unique ID within Veracity.
dnvglAccountName|string|The account name for the user.
myDnvglGuid⬇|string|**Deprecated:**  - The old id for the user.
oid|string|An object id within the Veracity IDP. Do not use this for user identification<br>@see userId
upn|string|
scp|string|

### IVIDPAccessTokenData
*extends IVIDPJWTTokenData<IVIDPAccessTokenPayload>*

Property|Type|Description
-|-|-
scope|string|The scope this token is valid for.
refreshToken?|string|If a refresh token was negotiated it will be contained here.

### IVIDPAccessToken
*extends IVIDPJWTToken<IVIDPAccessTokenPayload>*

Property|Type|Description
-|-|-


### IVIDPConfiguration


Property|Type|Description
-|-|-
clientID|string|Your applications client id from the Veracity for Developers Project Portal.
replyURL|string|One of your applications reply urls from the Veracity for Developers Portal.

### IVIDPWebAppConfiguration
*extends IVIDPConfiguration*

Property|Type|Description
-|-|-
clientSecret|string|Your applications client secret fromt he Veracity for Developers Project Portal.

### IVIDPIDTokenPayload
*extends IVIDPJWTTokenPayloadCommonClaims*

Property|Type|Description
-|-|-
c_hash?|string|Hash of the accompanying authorization code if this token is part of an authorization code flow.
at_hash?|string|Hash of the accompanying access token if this was part of an access token exchange.
acr|string|
auth_time|number|
userId|string|The unique Veracity ID of the user.
dnvglAccountName|string|
myDnvglGuid⬇|string|**Deprecated:**  - Legacy Veracity ID of the user. Use userId claim instead.
oid|string|The object id within the Veracity IDP.<br>Do not use this for user identification as it is not propagated to other Veracity services.
upn|string|

### IVIDPIDTokenData
*extends IVIDPJWTTokenData<IVIDPIDTokenPayload>*

Property|Type|Description
-|-|-
export interface IVIDPIDToken extends IVIDPJWTToken<IVIDPIDTokenPayload> { }|unspecified|

### IVIDPTokenData


Property|Type|Description
-|-|-
idToken|IVIDPIDTokenData|The parsed identity token.
accessTokens|{[apiScope: string]: IVIDPAccessTokenData}|Any access tokens recievied indexed by their associated scope.

### IVIDPWebAppStrategySettings


Property|Type|Description
-|-|-
clientId|string|The client id from the Application Credentials you created in the Veracity for Developers Provider Hub.
clientSecret?|string|The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub.<br>Required for web applications, but not for native applications.
replyUrl|string|The reply url from the Application Credentials you created in the Veracity for Developers Provider Hub.
apiScopes?<br>=["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"]|string[]|The scopes you wish to authenticate with. An access token will be retrieved for each api scope.<br>If you only wish to authenticate with Veracity you can ignore this or set it to an empty array to slightly improve performance.
metadataURL?<br>=VERACITY_METADATA_ENDPOINT|string|The url where metadata about the IDP can be found.<br>Defaults to the constant VERACITY_METADATA_ENDPOINT.

### IVIDPJWTTokenHeader


Property|Type|Description
-|-|-
typ|string|The type of token this is.
alg|string|The message authentication code algorithm.
kid|string|The id of the key used to sign this token.

### IVIDPJWTTokenData
*<TPayload>* 

Property|Type|Description
-|-|-
token|string|The full token string
header|IVIDPJWTTokenHeader|Header information from the token
payload|TPayload|The token payload
issued|number|Unix timestamp for when the token was issued.
lifetime|number|The number of seconds this token is valid for.
expires|number|Unix timestamp for when the token expires.

### IVIDPJWTTokenPayloadCommonClaims


Property|Type|Description
-|-|-
iss|string|Issuer
sub|"Not supported currently. Use oid claim."|Subject
aud|string|Audience
exp|number|Expiration time.
nbf|number|Not valid before time.
iat|number|Issued at time.
email|string[]|
nonce|string|
given_name|string|
family_name|string|
name|string|
ver|"1.0"|

### IVIDPJWTToken
*<TPayload>* 

Property|Type|Description
-|-|-
header|IVIDPJWTTokenHeader|
payload|TPayload|
signature|string|

### VIDPRequestErrorCodes


Property|Type|Description
-|-|-
"read_timeout"|"read_timeout"|A timeout occured when waiting to read data from the server.
"connect_timeout"|"connect_timeout"|A timeout occurred when waiting to establish a connection to the server.
"status_code_error"|"status_code_error"|The request returned a non 200 status code.

### VIDPAccessTokenErrorCodes


Property|Type|Description
-|-|-
"invalid_request"|"invalid_request"|Protocol error, such as a missing required parameter.
"invalid_grant"|"invalid_grant"|The authorization code or PKCE code verifier is invalid or has expired.
"unauthorized_client"|"unauthorized_client"|The authenticated client isn't authorized to use this authorization grant type.
"invalid_client"|"invalid_client"|Client authentication failed.
"unsupported_grant_type"|"unsupported_grant_type"|The authorization server does not support the authorization grant type.
"invalid_resource"|"invalid_resource"|The target resource is invalid because it does not exist, Azure AD can't find it, or it's not correctly configured.
"interaction_required"|"interaction_required"|The request requires user interaction. For example, an additional authentication step is required.
"temporarily_unavailable"|"temporarily_unavailable"|The server is temporarily too busy to handle the request.

### VIDPTokenValidationErrorCodes


Property|Type|Description
-|-|-
"malfomed_token"|"malfomed_token"|The token is malformed.<br>It may not consist of three segments or may not be parseable by the `jsonwebptoken` library.
"missing_header"|"missing_header"|The token is malformed. Its header is missing.
"missing_payload"|"missing_payload"|The token is malformed. Its payload is missing.
"missing_signature"|"missing_signature"|The token is malformed. Its signature
"no_such_public_key"|"no_such_public_key"|The token requested a public key with an id that does not exist in the metadata endpoint.
"verification_error"|"verification_error"|An error occured when verifying the token against nonce, clientId, issuer, tolerance or public key.
"incorrect_hash"|"incorrect_hash"|The token did not match the expected hash

### VIDPStrategyErrorCodes


Property|Type|Description
-|-|-
"missing_required_setting"|"missing_required_setting"|A required setting was missing. See description for more information.
"invalid_internal_state"|"invalid_internal_state"|The internal state of the system is not valid. This may occur when users peforms authentication too slowly<br>or if an attacker is attempting a replay attack.
"verifier_error"|"verifier_error"|An error occured in the verifier function called once the authentication is completed.
"unknown_error"|"unknown_error"|This error code occurs if the system was unable to determine the reason for the error.<br>Check the error details or innerError for more information.

### VIDPRefreshTokenErrorCodes


Property|Type|Description
-|-|-
"cannot_resolve_token"|"cannot_resolve_token"|Token refresh middleware was unable to resolve the token using the provided resolver.<br>See description for more details.

<!-- /types -->