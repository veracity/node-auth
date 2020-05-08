export const config = {
	clientID: "058474c5-1e84-48b1-9e8b-e8f9e0bbe275",
	clientSecret: "w:AhRaBScFapwHFAI@tGxCvxhD76[/53",
	apiKey: "cc8cae01af6f48f192b12f065100aa5c",
	sessionSecret: "bd9d648a-b2ba-46a6-a760-30e316ec899b", // The secret used by express-session. You should re-generate this for your environments.
	redirectUrl: "https://localhost:3000/auth/oidc/loginreturn", // This needs to be updated for every environment
	tenantID: "a68572e3-63ce-4bc1-acdc-b64943502e9d",
	policyName: "B2C_1A_SignInWithADFSIdp",
	scope: "https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation" // Request access token for Veracity API and returns the access_token.
}

export const authConfig = {
	loginPath: "/login",
	errorPath: "/error",
	logoutPath: "/logout",
	// The options we must pass to OpenID Connect. See https://github.com/AzureAD/passport-azure-ad
	oidcConfig: {
		identityMetadata: `https://login.microsoftonline.com/${config.tenantID}/v2.0/.well-known/openid-configuration`,

		clientID: config.clientID,
		clientSecret: config.clientSecret,

		isB2C: true,
		passReqToCallback: true,
		loggingLevel: "info",
		scope: [
			"openid", // Request the identity token
			"offline_access", // Request the refresh token so we can refresh if the access token times out
			config.scope // Add the scope for the access token from the configuration settings
		],

		responseType: "code",
		responseMode: "form_post", // How the authentication server will respond back when authentication is complete. 'form_post' is required by Azure B2C.
		redirectUrl: config.redirectUrl, // The url where authentication data is returned from B2C/ADFS. This MUST match the configured return url from when the application was registered.
		allowHttpForRedirectUrl: false // Prevent using HTTP for redirects. This forces use of HTTPS for all urls and is the safer method.
	},

	// We need this option to perform the login request properly.
	policyName: config.policyName,

	// The url we must use to log out properly and also destroy any session cookies.
	// We use the parameter 'post_logout_redirect_uri' to route users back to our application in order to finish the log out process on our end.
	// A route matching this url is set up in start.js to handle the final steps of the sign out process.
	destroySessionUrl: `https://login.microsoftonline.com/${config.tenantID}/oauth2/v2.0/logout?p=${config.policyName}&post_logout_redirect_uri=https://localhost:3000/logoutadfs`,

	// In order to complete the sign-out process ADFS needs to clear its session data as well. That is done by visiting this url.
	destroyADFSSessionUrl: "https://fsext1.dnv.com/adfs/ls/?wa=wsignout1.0"
}

export default authConfig