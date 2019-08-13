# Veracity Authentication library for NodeJS

This library provides tools for performing authentication with Veracity for a NodeJS application. It consists of:

- A PassportJs strategy
- Utilities for setting up express sessions correctly


## Dependencies

name|reason
-|-
`base64url`|Used when verifying `at_hash` and `c_hash` claims according to [this](https://openid.net/specs/openid-connect-core-1_0.html#HybridIDToken) specification.
`request`|Indirect dependency of `request-promise`
`request-promise`|Used to perform any server side HTTPs requests such as when retrieving metadata or exchanging authorization codes for access tokens.