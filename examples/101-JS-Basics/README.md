# Basics JS
This example demonstrates how to perform simple authentication with Veracity in NodeJS using JavaScript. The application allows users to authenticate with Veracity and shows you the claims returned from the Veracity Identity Provider (IDP). For a TypeScript example see *102-TS-Basics*

The example sets up a basic web server for a *development scenario* using `express` and then uses the helper function `setupAuthFlowStrategy` provided by the `@veracity/node-auth` library to initialize and configure `express-session`, `passport` and the endpoints needed in order to perform authentication.

To run the example clone this folder and run:
```javascript
npm i
```

Before you can start the application you need to provide your application credentials in the `credentials.js` file. Visit [https://developerdevtest.veracity.com/projects](https://developerdevtest.veracity.com/projects) in order to create your credentials.

Once ready you can run the demo like this:
```javascript
npm start
```

See additional documentation within the individual files.

## HTTPS
This example uses node-forge to create dummy certificates for the web server on the fly when the server is started. This is indeded purely for demo purposes and is **not** suitable for production. You must ensure your production server uses properly signed certificates.

## Session storage
`express-session` needs a persistent storage location in order to store session information for the user. There are a multitude of ways to do this and we recommend that you find the best session storage for your scenario. You can find an extensive list of options on the `express-session` [github page](https://github.com/expressjs/session#compatible-session-stores)