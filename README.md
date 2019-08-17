# Veracity Authentication library for NodeJS
This library provides tools for performing authentication with Veracity for a NodeJS application. It consists of:

- A PassportJs strategy for authenticating with Veracity and aquiring access tokens.
- Helper for setting up a more secure session configuration.

```javascript
npm i @veracity/node-auth
```

## Quick Start 🚀
Install the package by running:
```javascript
npm i @veracity/node-auth
```

Install all recommended dependencies to set up a webserver:
```javascript
npm i express express-session body-parser passport
```

Set up a basic webserver running on port 3000:
```javascript
// start.js

// Import express dependency
const express = require("express")

// Create an express app instance
const app = express()

// Set up a handler for the root of your application
app.get("/", (req, res) => {
	res.send("Hello world")
})

// Begin listening for connections
app.listen(3000, () => {
	console.log("Server ready on localhost:3000")
})
```

You should now be able to open your browser to [http://localhost:3000](http://localhost:3000)

Before you can authenticate with Veracity you need to register your application. This can be done in the Veracity for Developers Portal:
1. Visit [https://developerdevtest.veracity.com/projects](https://developerdevtest.veracity.com/projects) and enroll as a developer.
2. Create an **Application Credential** with the following reply url: `https://localhost:3000/auth/oidc/loginreturn` (note it **MUST** be https). This is the url your users will be redirected to when they get back from the login screen.
3. Once complete you should see a screen with a **Client ID** and **Client Secret**. Copy down both of these items. They are your applications username and password.

Now let's proceed with setting up your application.

In order to 

## Dependencies
name|reason
-|-
`base64url`|Used when verifying `at_hash` and `c_hash` claims according to [this](https://openid.net/specs/openid-connect-core-1_0.html#HybridIDToken) specification.
`jsonwebtoken`|Used to decode and validate access and id tokens.
`nanoid`|Used to generate cryptographically secure, unique strings for nonces and other scenarios.
`request`|Indirect dependency of `request-promise-native`
`request-promise-native`|Used to perform any server side HTTPs requests such as when retrieving metadata or exchanging authorization codes for access tokens.

## Recommendations
It is highly recommended that you use a TypeScript aware IDE when using this library as much of the documentation is in the form of interfaces. Such IDEs can show detailed documentation as you work making it easier to use this library correctly. We suggest [Visual Studio Code](https://code.visualstudio.com/).