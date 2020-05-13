# JS Passport example
This example implements Veracity authentication using the `VIDPWebAppStrategy` passport strategy directly. This is intended for more advanced scenarios where your code or structure makes it hard or impossible to use the simpler helper function. This sample ends up with the same features as the ones using the helper, but with more code as we have to implement everything ourselves.

You need to fill in application credentials on line 33-35 in `start.js` before this sample will run. Visit the [Veracity for Developers project portal](https://developer.veracity.com/projects) to create them.

To run the sample:
```javascript
npm i
npm start
```

## HTTPS
This sample uses `node-forge` along with the `generateCertificate` utility to create a self-signed certificate for local development. This is **not** suitable for production and should be replaced with a more secure certificate signed by a trusted third-party. For example: [https://letsencrypt.org/](https://letsencrypt.org/)

## Dependencies
- `@veracity/node-auth`
- `express`
- `express-session`
- `passport`
- `node-forge`