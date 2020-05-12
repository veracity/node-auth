import { Request, Response } from "express"
import { IDefaultAuthConfig } from '../interfaces'
import { VERACITY_API_SCOPES, VERACITY_LOGOUT_URL, VERACITY_POLICY, VERACITY_TENANT_ID } from './../constants'

export const authConfig: IDefaultAuthConfig = {
	loginPath: "/login",
	errorPath: "/error",
	logoutPath: "/logout",

	// The options we must pass to OpenID Connect. See https://github.com/AzureAD/passport-azure-ad
	oidcConfig: {
		identityMetadata: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/v2.0/.well-known/openid-configuration`,

		isB2C: true,
		passReqToCallback: true,
		loggingLevel: "info",
		scope: [
			"openid", // Request the identity token
			"offline_access", // Request the refresh token so we can refresh if the access token times out
			VERACITY_API_SCOPES.services
		],

		responseType: "code",
		responseMode: "form_post", // How the authentication server will respond back when authentication is complete. 'form_post' is required by Azure B2C.
		allowHttpForRedirectUrl: false // Prevent using HTTP for redirects. This forces use of HTTPS for all urls and is the safer method.
	},

	tenantID: VERACITY_TENANT_ID,

	// We need this option to perform the login request properly.
	policyName: VERACITY_POLICY,

	// The url we must use to log out properly and also destroy any session cookies.
	// We use the parameter 'post_logout_redirect_uri' to route users back to our application in order to finish the log out process on our end.
	// A route matching this url is set up in start.js to handle the final steps of the sign out process.
	destroySessionUrl: `https://login.microsoftonline.com/${VERACITY_TENANT_ID}/oauth2/v2.0/logout?p=${VERACITY_POLICY}&post_logout_redirect_uri=https://localhost:3000/logoutadfs`,

	// In order to complete the sign-out process ADFS needs to clear its session data as well. That is done by visiting this url.
	destroyADFSSessionUrl: "https://fsext1.dnv.com/adfs/ls/?wa=wsignout1.0",

	onBeforeLogin: (req: any, res: any, next: any) => {next()},
	onLoginComplete: (req: Request, res: Response) => {
		res.redirect(req.query.returnTo || "/")
	},
	onLogout: (req: any, res: any, next: any) => {
		req.logout()
		res.redirect(VERACITY_LOGOUT_URL)
	},
	onLoginError: (err: any, req: any, res: any, next: any) => {
		next(err)
	}
}

export default authConfig