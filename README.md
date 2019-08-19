# Veracity Authentication library for NodeJS
This library provides tools for performing authentication with Veracity for a NodeJS application. It consists of:

- A PassportJs strategy for authenticating with Veracity and aquiring access tokens.
- Helper for setting up a more secure session configuration.
- Helper for configuring an express application with Veracity authentication

## Installation

```javascript
npm i @veracity/node-auth
```

The recommeded stack that installs everything you need is:
```javascript
npm i @veracity/node-auth express express-session passport body-parser
```

## Dependencies
Allthough some dependencies are technically optional you will need to provide equivalent functionality should you decide to use something else. Some of the helper functions provided with this library assume you have the specific optional dependencies installed so if you decide to substitute any of them you may not be able to use those helper functions.

**required**
- [passport](http://www.passportjs.org/): This library comes with a passport strategy for authenticating with Veracity.

**optional**
- [express](https://expressjs.com/): Framework for building web applications in node. Any [Connect](https://github.com/senchalabs/connect) based framework should work.
- [express-session](https://github.com/expressjs/session): Session middleware for managing and storing session data.
- [body-parser](https://github.com/expressjs/body-parser): A middleware for express that allows easy access to a requset body by parsing it into proper objects.

## API
The API provides multiple ways for you to get started. The easiest way to get started is to use the helper function, but if you want more control over the process you can use the passport strategy directly.

```javascript
// Import the helper function. If you use this then you do not need to import anything else.
const { setupAuthFlowStrategy } = require("@veracity/node-auth/lib/helpers")

// Import the strategy directly. You will need to configure passport and express yourself.
const { VeracityAuthFlowStrategy } = require("@veracity/node-auth")
```

### Authentication using the helpers
This is the easiest way to get started using Veracity Authentication. All you need to do is call one function with a few configuration settings and you are ready to authenticate. The helper function assumes you have installed the optional dependencies described above.

```javascript
// Assuming your express instance is called app
setupAuthFlowStrategy({
	appOrRouter: app,
	loginPath: "/login",
	strategySettings: {
		clientId: "", // Configure this yourself
		clientSecret: "", // Configure this yourself
		redirectUri: "https://localhost:3000/auth/oidc/loginreturn"
	},
	sessionSettings: {
		secret: "298a5530-b5d0-4e52-95f8-5b2d2a4425a2", // You should create your own secret.
		store: ... // You must provide a sensible storage system for your session data. See https://github.com/expressjs/session#compatible-session-stores
	},
	
	onLoginVerifier: (options, done, req) => {
		done(null, options) // This simply stores all data on req.user. You may need to modify this.
	},
	onLoginComplete: (req, res, next) => {
		// Returns the user to the home page or a custom page if one is provided when logging in
		res.redirect(req.query.returnTo || "/")
	}
})
```

Your application can now authenticate with Veracity. This setup also negotiates for an access token to communicate with the Veracity Services API. Finally everything is stored on the `req.user` object.

### Authentication using the passport strategy
TODO

### Passing data from the login request to the final handler
Sometimes it's useful to be able to pass data from before the login process begins to after it has completed. For instance if you wish to ensure the user is redirected back to the page they were originally on before they logged in. There are two ways to do this with the `VeracityAuthFlowStrategy`:

1. Pass query parameters to the login endpoint. By default any query parameters passed to the login path where passport begins authenticating will be kept and available on `req.query` after the authentication has completed.
2. You can pass additional data by setting the `veracityAuthState` object on the requset before beginning authentication. This will also be passed through and available on the final request object after authentication.

Passing data using automatic query parameter passthrough:
```javascript
// Users visits /login?fromPage=/article/awesome-stuff
app.get("/login", passport.authenticate("veracity"))

// User returns from login
app.post("/auth/oidc/loginreturn", bodyParser.urlencoded(), passport.authenticate("veracity"), (req, res) => {
	res.redirect(req.query.article) // redirects to /article/awesome-stuff
})
```

Passing data using `veracityAuthState` object is a bit more tricky. We need to register our own middleware before running `passport.authenticate`. Our handler can then populate the `veracityAuthState` object as needed:
```javascript
// User visits /login
app.get("/login", (req, res, next) => {
	req.veracityAuthState = {
		beginAuthAt: Date.now()
	}
})

// User returns from login
app.post("/auth/oidc/loginreturn", bodyParser.urlencoded(), passport.authenticate("veracity"), (req, res) => {
	// We can now use all parameters from veracityAuthState
	res.send({
		authorizationBeganAt: req.veracityAuthState.beginAuthAt
		totalTime: Date.now() - req.veracityAuthState.beginAuthAt
	})
})
```

### Configuration
#### VeracityAuthFlowStrategy configuration (`IVeracityAuthFlowStrategySettings`)

- `tenantId`: Default: `a68572e3-63ce-4bc1-acdc-b64943502e9d` The id of the Veracity IDP. You probably do not need to change this.
- `policy`: Default: `B2C_1A_SignInWithADFSIdp` Describes the way you want to authenticate. You probably do not need to change this.
- `clientId`: This is your applications client id. Use the [Veracity for Developers](https://developerdevtest.veracity.com/projects) portal to create this.
- `clientSecret`: This is your applications client secret. Use the [Veracity for Developers](https://developerdevtest.veracity.com/projects) portal to create this.
- `redirectUrl`: The url users are redirected back to after logging in. You can configure this in the [Veracity for Developers](https://developerdevtest.veracity.com/projects) portal.
- `requestRefreshToken`: Default `true`. Set this to true if you want to retrieve a refresh token along with each access token you want. Refresh tokens allow you to request new access tokens once they expire.
- `apiScopes`: Defaults to scope for Veracity Services API. This is where you configure which scopes you want to aquire access tokens for when users log in. You can specify zero or more scopes depending on your need. If you do not need to call any of the Veracity APIs, but simply wish to use Veracity for authentication alone you can leave this setting blank.
- `configuration`: These are custom configurations for the internals of the authentication process
- `configuration.keepMetadataFor`: Specify the number of seconds to cache metadata locally when retrieved. Setting this value can improve the performance when users log in, but settings may go stale. If you wish to use this setting it is recommended that you do not set it too long. Around `120` seconds is common.

## Recommendations
It is highly recommended that you use a TypeScript aware IDE when using this library as much of the documentation is in the form of interfaces. Such IDEs can show detailed documentation as you work making it easier to use this library correctly. We suggest [Visual Studio Code](https://code.visualstudio.com/).