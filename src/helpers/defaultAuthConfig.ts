import { Request, Response } from "express"
import { IDefaultAuthConfig } from '../interfaces'
import { VERACITY_API_SCOPES, VERACITY_LOGOUT_URL, VERACITY_POLICY, VERACITY_TENANT_ID } from './../constants'
import { CustomLogger } from "./logger"

const logger = new CustomLogger()

export const authConfig: IDefaultAuthConfig = {
	loginPath: "/login",
	errorPath: "/error",
	logoutPath: "/logout",
	name: "veracity-oidc",

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

	onBeforeLogin: (req: any, res: any, next: any) => {next()},
	onLoginComplete: (req: Request, res: Response) => {
		res.redirect(req.query.returnTo || "/")
	},
	onLogout: (req: any, res: any, next: any) => {
		logger.info("Logging out user")
		if (req.session) {
			req.session.destroy(() => {
				req.logout()
				res.redirect(VERACITY_LOGOUT_URL)
			})
		}
	},
	onLoginError: (err: any, req: any, res: any, next: any) => {
		logger.error("Error in onLoginError" + err.message)
		next(err)
	},
	onVerify: (req, iss, sub, profile, jwtClaims, accessToken, refreshToken, params, done) => {
		logger.info("Running onVerify function")
		const { expires_in, expires_on } = params
		const additionalInfo: {accessTokenExpires?: number, accessTokenLifetime?: number} = {}
		if (expires_in) additionalInfo.accessTokenExpires =  Number(expires_in)
		if (expires_on) additionalInfo.accessTokenLifetime = Number(expires_on)
		const user = { // Extract information from the data returned from B2C/ADFS
			name: jwtClaims.name,
			id: jwtClaims.oid,
			displayName: profile.displayName,

			// "https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75"
			tokens: {
				services: {
					access_token: accessToken,
					refresh_token: refreshToken,
					...additionalInfo
				}
			}
		}

		done(null, user) // Tell passport that no error occured (null) and which user object to store with the session.
	}
}

export default authConfig