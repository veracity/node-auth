import { NextFunction, Request } from "express"
import { getVIDPMetadata } from "../auth/getVIDPMetadata"
import { parseVIDPAccessToken } from "../auth/parseVIDPToken"
import { refreshVIDPAccessToken } from "../auth/refreshVIDPAccessToken"
import { lessThan5Mintes } from "../auth/tokenRefreshStrategies"
import { validateVIDPToken } from "../auth/tokenValidators"
import { VIDPError, VIDPErrorSources, VIDPRefreshTokenErrorCodes } from "../errors"
import {
	IVIDPAccessToken,
	IVIDPAccessTokenData,
	IVIDPWebAppStrategySettings
} from "../interfaces"

const resolveToken = (
	tokenResolver: (string | ((req: Request) => IVIDPAccessTokenData | Promise<IVIDPAccessTokenData>))
	) => async (req: Request) => {
	if (typeof tokenResolver === "function") {
		return tokenResolver(req)
	}
	const anyReq: any = req
	if (!anyReq.user || !anyReq.user.accessTokens) {
		throw new VIDPError(
			VIDPRefreshTokenErrorCodes.cannot_resolve_token,
			"Cannot resolve token from string beacuse req.user or req.user.accessTokens was missing.",
			VIDPErrorSources.refreshAccessTokenRequest, anyReq.user)
	}
	return anyReq.user.accessTokens[tokenResolver] as IVIDPAccessTokenData
}

/**
 * Create refresh token middleware that can be used to automatically refresh a token based on the scope
 * or a token resolver.
 * @param options The strategy options
 * @param onTokenRefreshed A function that is given the new access token
 */
export const createRefreshTokenMiddleware = (
		options: IVIDPWebAppStrategySettings,
		onTokenRefreshed: ((tokenData: IVIDPAccessTokenData, req: Request) => void | Promise<void>),
		metadataURL: string
	) => (
		tokenResolverOrApiScope: (string | ((req: Request) => IVIDPAccessTokenData | Promise<IVIDPAccessTokenData>)),
		refreshStrategy?: ((token: IVIDPAccessTokenData, req: Request) => boolean)
	) => async (req: any, res: any, next: NextFunction) => {
	try {
		const oldToken = await resolveToken(tokenResolverOrApiScope)(req)
		if (!oldToken) {
			throw new VIDPError(
				VIDPRefreshTokenErrorCodes.cannot_resolve_token,
				"The resolver did not return a token object.",
				VIDPErrorSources.refreshAccessTokenRequest
			)
		}

		const realRefreshStrategy = refreshStrategy || lessThan5Mintes
		if (!realRefreshStrategy(oldToken, req)) { // If strategy says not to refresh then don't do anything
			next()
			return
		}

		const metadata = await getVIDPMetadata(metadataURL)
		const tokenData = await refreshVIDPAccessToken({
			client_id: options.clientId,
			client_secret: options.clientSecret,
			refresh_token: oldToken.refreshToken!,
			scope: "offline_access "+oldToken.scope,
			tokenURL: metadata.token_endpoint
		})

		const {issuer, jwks} = metadata
		const {token: newAccessToken, tokenDecoded: newAccessTokenDecoded} = validateVIDPToken<IVIDPAccessToken>({
			issuer,
			jwks,
			token: tokenData.access_token
		})

		const newTokenData: IVIDPAccessTokenData = {
			...parseVIDPAccessToken(newAccessToken, newAccessTokenDecoded, oldToken.scope),
			refreshToken: tokenData.refresh_token
		}
		await onTokenRefreshed(newTokenData, req) // Call the refresh handler
		next()
	} catch (error) {
		if (error instanceof VIDPError) {
			error.source = VIDPErrorSources.refreshAccessTokenRequest
		}
		next(error)
	}
}
