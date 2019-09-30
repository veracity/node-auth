import { IVIDPAccessToken, IVIDPAccessTokenData } from "../interfaces"
import { IVIDPJWTToken, IVIDPJWTTokenData, IVIDPJWTTokenPayloadCommonClaims } from "../interfaces/IVIDPWTToken"

/**
 * Given a raw token string and the decoded version (done via verifier) returns a full token data object.
 * @param token
 * @param tokenDecoded
 */
export const parseVIDPToken = <TPayload extends IVIDPJWTTokenPayloadCommonClaims>(
	token: string, tokenDecoded: IVIDPJWTToken<TPayload>): IVIDPJWTTokenData<TPayload> => {
	const {nbf, iat, exp} = tokenDecoded.payload
	return {
		token,
		header: tokenDecoded.header,
		payload: tokenDecoded.payload,
		issued: iat,
		lifetime: exp - nbf,
		expires: exp
	}
}

/**
 * Parses an access token and returns a proper IVIDPAccessTokenData object for it.
 * Internally uses parseToken.
 * @param token
 * @param tokenDecoded
 * @param scope
 */
export const parseVIDPAccessToken = (
	token: string, tokenDecoded: IVIDPAccessToken, scope: string): IVIDPAccessTokenData => {
	return {
		scope,
		...parseVIDPToken(token, tokenDecoded)
	}
}
