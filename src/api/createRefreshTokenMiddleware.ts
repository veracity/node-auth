import { NextFunction, Request, Response } from "express"
import { VIDPError } from "../errors"
import { VIDPErrorSources } from './../errors/VIDPError'
import request from "./request"

const resolveRefreshToken = (req: Request) => {
	try {
		const anyReq: any = req
		return anyReq.user.tokens.services.refresh_token
	} catch (e) {
		throw new VIDPError("resolve_refresh_token_error", "Unable to resolve refresh token from the request. Missing user, user.tokens or user.tokens.", VIDPErrorSources.refreshAccessTokenRequest, {}, e)
	}
}

interface IRefreshConfig {
	tenantID: string
	policyName: string
	clientID: string
	clientSecret?: string
	scope?: string
}

/**
 * https://docs.microsoft.com/en-us/azure/active-directory-b2c/authorization-code-flow#4-refresh-the-token
 * @param req Express.Request
 * @param res Express.Response
 * @param next Express.NextFunction
 */
export const createRefreshTokenMiddleware = (config: IRefreshConfig) => async (req: Request, res: Response, next: NextFunction) => {
	const refreshToken = resolveRefreshToken(req)
	const endpoint = `https://login.microsoftonline.com/${config.tenantID}/oauth2/v2.0/token?p=${config.policyName}` // `https://${config.tenantID}.b2clogin.com/${config.tenantID}.onmicrosoft.com/${config.policyName}/oauth2/v2.0/token`
	const payload = {
		client_id: config.clientID,
		client_secret: config.clientSecret,
		grant_type: "refresh_token",
		scope: "offline_access " + config.scope,
		refresh_token: refreshToken
	}

	const response = await request(endpoint, {
		method: "POST",
		form: payload
	})

	const data = JSON.parse(response)

	if (data.access_token && data.refresh_token) {
		const { refresh_token, access_token, expires_in, expires_on } = data
		const additionalInfo: {accessTokenExpires?: number, accessTokenLifetime?: number} = {}
		if (expires_in) additionalInfo.accessTokenExpires =  Number(expires_in)
		if (expires_on) additionalInfo.accessTokenLifetime = Number(expires_on)
		const anyReq = req as any
		anyReq.user.tokens.services = {
			access_token,
			refresh_token,
			...additionalInfo
		}
	} else {
		throw new Error("No access_token or refresh_token found when trying to refresh in refreshTokenMiddleware")
	}

	next()
}