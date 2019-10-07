# Veracity Authentication library for NodeJS
This library provides utilities that help with authentication against the Veracity Identity Provider.

## Version 1.0 released
Version `1.0.0` is the first officially released and supported implementation of this library. The API has been changed from version `0.3.1-beta` and is not backwards compatible. This documentation as been revamped to describe the new library. See the code samples for detailed implementation instructions.

## Features
- PassportJS authentication strategy for web applications using the Veracity Identity Provider.
- Helper for setting up authentication with Veracity as well as logout.
- Middleware for refreshing tokens.
- Support for encrypting session data at-rest.

## Table of contents

<!-- toc -->

- [Quick Start](#quick-start)
  * [onVerify / Verifier](#onverify--verifier)
- [Encrypting session](#encrypting-session)
- [Passing state](#passing-state)
- [Error handling](#error-handling)
- [Authentication process](#authentication-process)
- [Logging out](#logging-out)
- [Data structures](#data-structures)
  * [IRouterLike](#irouterlike)
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

## Quick Start
See one of the [samples](./samples) to get started.

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

## Encrypting session
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

### IRouterLike
*extends Pick<Router, "use" | "get" | "post">*

Property|Type|Description
-|-|-


### ISetupWebAppAuthSettings


Property|Type|Description
-|-|-
name?|string|An optional name for the strategy when registering with passport.
app|IRouterLike|The express application to configure or the router instance.
session|IMakeSessionConfigObjectOptions|Session configuration
strategy|IVIDPWebAppStrategySettings|Configuration for the strategy you want to use.
loginPath?|string|The path where login will be configured
logoutPath?|string|The path where logout will be configured
onBeforeLogin?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void|Provide a function that executes before the login process starts.<br>It executes as a middleware so remember to call next() when you are done.
onVerify?|VIDPWebAppStrategyVerifier|The verifier function passed to the strategy.<br>If not defined will be a passthrough verifier that stores everything from the strategy on `req.user`.
onLoginComplete?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void,|A route handler to execute once the login is completed.<br>The default will route the user to the returnTo query parameter path or to the root path.
onLogout?|(req: Request & {veracityAuthState?: any}, res: Response, next: NextFunction) => void,|A route handler to execute once the user tries to log out.<br>The default handler will call `req.logout()` and redirect to the default Veracity central logout endpoint.
onLoginError?|(error: VIDPError, req: Request, res: Response, next: NextFunction) => void|An error handler that is called if an error response is received from the Veracity IDP authentication redirect.<br>If not defined will pass the error on to the default error handler in the app or router.

### IVIDPAccessTokenPayload
*extends IVIDPJWTTokenPayloadCommonClaims*

Property|Type|Description
-|-|-
azp|string|
userId|string|The users unique ID within Veracity.
dnvglAccountName|string|The account name for the user.
myDnvglGuid⬇|string|The old id for the user.
oid|string|An object id within the Veracity IDP. Do not use this for user identification @see userId
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
myDnvglGuid⬇|string|Legacy Veracity ID of the user. Use userId claim instead.
oid|string|The object id within the Veracity IDP. Do not use this for user identification as it is not propagated to other Veracity services.
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
clientSecret?|string|The client secret from the Application Credentials you created in the Veracity for Developers Provider Hub. Required for web applications, but not for native applications.
replyUrl|string|The reply url from the Application Credentials you created in the Veracity for Developers Provider Hub.
apiScopes?<br>=["https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation"]|string[]|The scopes you wish to authenticate with. An access token will be retrieved for each api scope. If you only wish to authenticate with Veracity you can ignore this or set it to an empty array to slightly improve performance.
metadataURL?<br>=VERACITY_METADATA_ENDPOINT|string|The url where metadata about the IDP can be found. Defaults to the constant VERACITY_METADATA_ENDPOINT.

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
"malfomed_token"|"malfomed_token"|The token is malformed. It may not consist of three segments or may not be parseable by the `jsonwebptoken` library.
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
"invalid_internal_state"|"invalid_internal_state"|The internal state of the system is not valid. This may occur when users peforms authentication too slowly or if an attacker is attempting a replay attack.
"verifier_error"|"verifier_error"|An error occured in the verifier function called once the authentication is completed.
"unknown_error"|"unknown_error"|This error code occurs if the system was unable to determine the reason for the error. Check the error details or innerError for more information.

### VIDPRefreshTokenErrorCodes


Property|Type|Description
-|-|-
"cannot_resolve_token"|"cannot_resolve_token"|Token refresh middleware was unable to resolve the token using the provided resolver. See description for more details.

<!-- /types -->