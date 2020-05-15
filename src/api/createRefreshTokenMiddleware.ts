import { NextFunction, Request, Response } from "express"
import { VIDPError } from "../errors"
import { VIDPErrorSources } from '../errors/VIDPError'
import { CustomLogger } from "../helpers/logger"
import request from "./request"

const logger = new CustomLogger()

const resolveRefreshToken = (req: Request) => {
	try {
		const anyReq: any = req
		return anyReq.user.tokens.services.refresh_token
	} catch (e) {
		logger.error("Unable to resolve refresh token from the request. Missing user, user.tokens or user.tokens.")
		throw new VIDPError("resolve_refresh_token_error", "Unable to resolve refresh token from the request. Missing user, user.tokens or user.tokens.", VIDPErrorSources.refreshAccessTokenRequest, {}, e)
	}
}

export interface IRefreshConfig {
	tenantID: string
	policyName: string
	clientID: string
	clientSecret?: string
	scope?: string
}

/**
 * Middleware for getting new access token from refresh token
 * https://docs.microsoft.com/en-us/azure/active-directory-b2c/authorization-code-flow#4-refresh-the-token
 */
export const createRefreshTokenMiddleware = (config: IRefreshConfig) => async (req: Request, res: Response, next: NextFunction) => {
	const refreshToken = resolveRefreshToken(req)
	logger.info("Got refresh token from request")
	const endpoint = `https://login.microsoftonline.com/${config.tenantID}/oauth2/v2.0/token?p=${config.policyName}`
	const payload = {
		client_id: config.clientID,
		client_secret: config.clientSecret,
		grant_type: "refresh_token",
		scope: "offline_access " + config.scope,
		refresh_token: refreshToken
	}

	try {
		const response = await request(endpoint, {
			method: "POST",
			form: payload
		})
		logger.info("Successful request to get new access token from refresh_token")

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
			logger.info("Success updating tokens to user session")
		} else {
			logger.error("No access_token or refresh_token found when trying to refresh in refreshTokenMiddleware")
			throw new VIDPError("missing_token","No access_token or refresh_token found when trying to refresh in refreshTokenMiddleware")
		}
		return next()
	} catch (error) {
		if (error.statusCode && error.statusCode > 299) {
			logger.error("Fetch to get new access token failed with status code " + error.statusCode + " and message " + error.message)
		} else {
			logger.error("Fetch to get new access token failed with message '" + error.message + "'")
		}
		if (error instanceof VIDPError) {
			error.source = VIDPErrorSources.refreshAccessTokenRequest
		}
		return next(error)
	}
}