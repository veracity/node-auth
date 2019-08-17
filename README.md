# Veracity Authentication library for NodeJS
This library provides tools for performing authentication with Veracity for a NodeJS application. It consists of:

- A PassportJs strategy for authenticating with Veracity and aquiring access tokens.
- Helper for setting up a more secure session configuration.

```javascript
npm i @veracity/node-auth
```

See examples located in the examples folder in this repository for detailed explanations on how to get started using Veracity as an identity provider for your application.

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