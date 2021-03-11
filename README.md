# Veracity Authentication library for NodeJS
[![npm version](https://img.shields.io/npm/v/@veracity/node-auth)](https://npmjs.org/package/@veracity/node-auth "View this project on npm")
[![package dependencies](https://img.shields.io/librariesio/release/npm/@veracity/node-auth)](https://npmjs.org/package/@veracity/node-auth "View this project on npm")
[![Known Vulnerabilities](https://snyk.io/test/github/veracity/node-auth/badge.svg?targetFile=package.json)](https://snyk.io/test/github/veracity/node-auth?targetFile=package.json)
[![Issues](https://img.shields.io/github/issues/veracity/node-auth.svg)]( https://github.com/veracity/node-auth/issues )
[![Downloads](https://img.shields.io/npm/dw/@veracity/node-auth)](https://npmjs.org/package/@veracity/node-auth)

This library provides utilities that help with authentication against the Veracity Identity Provider. It's based on the robust libraries [`passport`](https://github.com/jaredhanson/passport) and the strategy [`passport-azure-ad`](https://github.com/AzureAD/passport-azure-ad).

## Features
- PassportJS authentication strategy for web applications using the Veracity Identity Provider.
- Helper for setting up authentication with Veracity as well as logout.
- Middleware for refreshing tokens.
- Support for encrypting session data at-rest.

## Table of contents

<!-- toc -->

- [Installation](#installation)
- [Examples](#examples)
- [Usage](#usage)
- [Passing state](#passing-state)
- [Check if the user is logged in](#check-if-the-user-is-logged-in)
- [Authentication process](#authentication-process)
- [Refresh token](#refresh-token)
- [Logging out](#logging-out)
- [Error handling](#error-handling)
- [Logging](#logging)
- [Data structures](#data-structures)
  * [IDefaultAuthConfig](#idefaultauthconfig)
  * [IFullAuthConfig](#ifullauthconfig)
  * [IExtraAuthenticateOptions](#iextraauthenticateoptions)
  * [ILoggerLike](#iloggerlike)
  * [IRouterLike](#irouterlike)
  * [ISetupWebAppAuthSettings](#isetupwebappauthsettings)
  * [IVIDPAccessTokenPayload](#ividpaccesstokenpayload)
  * [IVIDPAccessTokenData](#ividpaccesstokendata)
  * [IVIDPAccessToken](#ividpaccesstoken)
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
- [Helpers](#helpers)
  * [Encrypting session](#encrypting-session)
  * [Generate certificate](#generate-certificate)

<!-- tocstop -->

## Installation
Run `npm i @veracity/node-auth` or `yarn add @veracity/node-auth` to install. TypeScript types are included in the package.

## Examples
See one of the [examples](./examples) to get started. 

## Usage
The helper `setupWebAppAuth` simplifies setting up authentication towards Veracity. If you're looking for an alternative, you can use [`passport`](https://github.com/jaredhanson/passport) in combination with [`passport-azure-ad`](https://github.com/AzureAD/passport-azure-ad). 

```javascript
const express = require("express")
const https = require("https")
const app = express()
const { setupWebAppAuth, generateCertificate } = require("@veracity/node-auth")
const { MemoryStore } = require("express-session")

const { refreshTokenMiddleware } = setupWebAppAuth({
	app,
	session: {
		secret: "your-long-super-secret-secret-here",
		store: new MemoryStore() // Notice! Only use MemoryStore for development
	},
	strategy: { // Fill these in with values from your Application Credential
		clientId: "<your-client-id>",
		clientSecret: "<your-client-secret>",
		replyUrl: "https://localhost:3000/auth/oidc/loginreturn" // make sure to update with your own replyUrl
	}
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
app.get("/refresh", refreshTokenMiddleware(), (req, res) => {
	res.send("Refreshed token!")
})

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
```
`setupWebAppAuth` register the following default routes: 
* `/login`: Path used to initialize the login process
* `/logout`: Path used to log out the user and delete session data
* `/error`: Where the user is redirected if there are errors in the login process

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
		req.veracityAuthState = JSON.stringify({redirect: "/here"})
		next()
	},
	onLoginComplete: (req, res, next) => {		
		const state = JSON.parse(req.veracityAuthState)
		res.redirect(state.redirect || "/")
	}
})
```

## Check if the user is logged in
Call the method `req.isAuthenticated()` to see if the user is logged in. Returns a `boolean`.

## Authentication process
The authentication process used by Veracity is called *Open ID Connect* with token negotiation using *Authorization Code Flow*. Behind the scenes, Veracity relies on Microsoft Azure B2C to perform the actual login. You can read more about the protocol on [Microsoft's website](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow).

This library provides you with a *strategy* that you can use to perform authentication. The strategy is compatible with PassportJS and allows any Connect-compatible library to authenticate with Veracity. The technicalities of the protocol are then handled by the library and you can focus on utilizing the resulting tokens to call APIs and build your application.

## Refresh token
The library also gives you a way to refresh the token. The method is returned to you when calling the `setupWebAppAuth` method:
```javascript
const { refreshTokenMiddleware } = setupWebAppAuth(/* ... config ... */)
``` 
Later, use the `refreshTokenMiddleware` method like this:
```javascript
app.get("/refresh", refreshTokenMiddleware(), (req, res, next) => {
	res.send("OK, token refreshed")
})
```
If you provide your own `onVerify` function to `setupWebAppAuth` and want to store the tokens in some specific location, you can pass in the optional arguments for resolving refresh token and storing the access token like so: 
```javascript
const resolveRefreshToken = (req) => req.user.customTokenPlacement.refreshToken
const storeRefreshedTokens = (refreshResponse, req) => {
	req.user.customTokenPlacement = {
		accessToken: refreshResponse.access_token,
		refreshToken: refreshResponse.refresh_token
	}
}
app.get("/refresh", refreshTokenMiddleware(resolveRefreshToken, storeRefreshedTokens), (req, res, next) => {
	res.send("OK, token refreshed")
})
```

## Logging out
Logging out users is a relatively simple process. Your application is storing session information (user data including access tokens) within some kind of session storage. This must be removed. Then you need to redirect users to the sign out page on Veracity to centrally log them out. This last step is required by Veracity to adhere to security best-practices. The logout url is set up bt default to "/logout", but you can change it by passing `logoutPath` in the configuration object of `setupWebAppAuth`.

The URL on Veracity where you should direct users logging out is stored as a constant in this library:
```javascript
const { VERACITY_LOGOUT_URL } = require("@veracity/node-auth")

app.get("/logout", (req, res) => {
	req.logout()
	res.redirect(VERACITY_LOGOUT_URL)
})
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

## Logging
You can pass in a custom logger when using `setupWebAppAuth`. Example:
```javascript
const express = require("express")
const { MemoryStore } = require("express-session")
const { setupWebAppAuth } = require("../../dist")
const winston = require("winston")

const app = express()

setupWebAppAuth({
	app,
	strategy: {
		clientId: "...",
		clientSecret: "...",
		replyUrl: "https://localhost:3000/auth/oidc/loginreturn"
	},
	session: {
		secret: "...",
		store: new MemoryStore()
	},
	logger: winston.createLogger({
		transports: [
			new winston.transports.Console(),
		]
	  })
})
```

## Data structures
⭐️

The library makes use of several data structures. They are all defined as TypeScript interfaces that will be visible in any TypeScript aware editor. Below is an export of all public types.

<!-- types -->
### IDefaultAuthConfig


Property|Type|Description
-|-|-
loginPath|string|
logoutPath|string|
errorPath|string|
logLevel|LogLevel|
name|string|
oidcConfig|Omit<IOIDCStrategyOption, "clientID" \| "redirectUrl">|
policyName|string|
tenantID|string|
onLogout|(req: Request, res: Response, next: NextFunction) => void|
onBeforeLogin|(req: Request, res: Response, next: NextFunction) => void|
onVerify|VerifyOIDCFunctionWithReq|
onLoginComplete|(req: Request, res: Response, next: NextFunction) => void|

### IFullAuthConfig
*extends Omit<IDefaultAuthConfig, "oidcConfig">*

Property|Type|Description
-|-|-
oidcConfig|IOIDCStrategyOption|
session|IMakeSessionConfigObjectOptions|
additionalAuthenticateOptions?|IExtraAuthenticateOptions|Additional options passed to `passport.authenticate`

### IExtraAuthenticateOptions


Property|Type|Description
-|-|-
extraAuthReqQueryParams?|{[key: string]: string \| number | boolean}|

### ILoggerLike


Property|Type|Description
-|-|-
info|(str: any) => void|
warn|(str: any) => void|
error|(str: any) => void|
levels?|(str: any) => void|


### IRouterLike
*extends Pick<Router, "use" | "get" | "post">*

Property|Type|Description
-|-|-


### ISetupWebAppAuthSettings


Property|Type|Description
-|-|-
app|IRouterLike|The express application to configure or the router instance.
errorPath?|string|Where to redirect user on error
loginPath?|string|The path where login will be configured
logoutPath?|string|The path where logout will be configured
logLevel?<br>="error"|LogLevel|Logging level
session|IMakeSessionConfigObjectOptions|Session configuration for express-session
strategy|IVIDPWebAppStrategySettings|Configuration for the strategy you want to use.
name?<br>="veracity-oidc"|string|Name of the passport strategy
policyName?<br>="B2C_1A_SignInWithADFSIdp"|string|Policy to use when logging in.
onBeforeLogin?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void|Provide a function that executes before the login process starts.<br>It executes as a middleware so remember to call next() when you are done.
onVerify?|VerifyOIDCFunctionWithReq|The verifier function passed to the strategy.<br>If not defined will be a passthrough verifier that stores everything from the strategy on `req.user`.
onLoginComplete?|(req: Request, res: Response, next: NextFunction) => void,|A route handler to execute once the login is completed.<br>The default will route the user to the returnTo query parameter path or to the root path.
onLogout?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void,|A route handler to execute once the user tries to log out.<br>The default handler will call `req.logout()` and redirect to the default Veracity central logout endpoint.
logger?|ILoggerLike|Optional provide your own logger

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


### IVIDPWebAppStrategySettings


Property|Type|Description
-|-|-
clientId|string|The client id from the Application Credentials you created in the Veracity for Developers Provider Hub.
clientSecret?|string|The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub.<br>Required for web applications, but not for native applications.
replyUrl|string|The reply url from the Application Credentials you created in the Veracity for Developers Provider Hub.
apiScopes?<br>=["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"]|string[]|The scopes you wish to authenticate with. An access token will be retrieved for each api scope.<br>If you only wish to authenticate with Veracity you can ignore this or set it to an empty array to slightly improve performance.
metadataURL?<br>=VERACITY_METADATA_ENDPOINT|string|The url where metadata about the IDP can be found.<br>Defaults to the constant VERACITY_METADATA_ENDPOINT.
additionalAuthenticateOptions?|IExtraAuthenticateOptions|Additional options passed to `passport.authenticate`

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

## Helpers
### Encrypting session
When configuring authentication you need to provide a place to store session data. This is done through the `store` configuration for `express-session`. In the samples we use a MemoryStore instance that keeps the data in memory, but this is not suitable to for production as it does not scale. For such systems you would probably go with a database or cache of some kind such as MySQL or Redis.

Once you set up such a session storage mechanism, however there are some considerations you need to take into account. Since the access tokens for individual users are stored as session data it means that anyone with access to the session storage database can extract any token for a currently logged in user and use it themselves. Since the token is the only key needed to perform actions on behalf of the user it is considered sensitive information and must therefore be protected accordingly.

This library comes with a helper function to deal with just this scenario called `createEncryptedSessionStore`. This function uses the **AES-256-CBC** algorithm to encrypt and decrypt a subset of session data on-the-fly preventing someone with access to the store from seeing the plain access tokens. They will only see an encrypted blob of text.

The way `createEncryptedSessionStore` works is that it replaces the read and write functions of an `express-session` compatible store with augmented versions that decrypt and encrypt a set of specified properties (if present on the session object) respectively. This means that you can still use any of the compatible store connectors and simply pass it through the helper function to get a version that provides encryption.

Using the Redis connector you can configure an encrypted session like this:
```javascript
const session = require("express-session")
const { createEncryptedSessionStore } = require("@veracity/node-auth")
const redisStore = require("connect-redis")(session)

// You should NOT hard-code the encryption key. It should be served from a secure store such as Azure KeyVault or similar
const encryptedRedisStore = createEncryptedSessionStore("encryption key")(redisStore)

// We can now use the encryptedRedisStore in place of a regular store to configure authentication
setupWebAppAuth({
	app,
	strategy: {
		clientId: "",
		clientSecret: "",
		replyUrl: ""
	},
	session: {
		secret: "ce4dd9d9-cac3-4728-a7d7-d3e6157a06d9",
		store: encryptedRedisStore // Use encrypted version of redis store
	}
})
```

### Generate certificate
A helper to generate certificate that can be used for local development.

```javascript
const express = require("express")
const app = express()
const https = require("https")
const { generateCertificate } = require("@veracity/node-auth")

app.get("/", (req, res, next) => {
	res.send("Frontpage here")
})

// Set up the HTTPS development server
const server = https.createServer({
	...generateCertificate() // Generate self-signed certificates for development
}, app)

server.on("error", (error) => { // If an error occurs halt the application
	console.error(error)
	process.exit(1)
})

server.listen(3000, () => { // Begin listening for connections
	console.log("Listening for connections on https://localhost:3000/")
})
```