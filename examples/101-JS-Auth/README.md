# JS Helper example
This example implements Veracity authentication using the `setupWebAppAuth` helper function. For details see the `start.js` file.

You need to fill in application credentials on line 23-25 in `start.js` before this sample will run. Visit the [Veracity for Developers project portal](https://developer.veracity.com/projects) to create them.

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