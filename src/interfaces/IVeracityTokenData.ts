import { IVeracityAccessTokenPayload, IVeracityIDTokenPayload } from "./veracityTokens"

/**
 * Describes all data recorded about a valid access token.
 */
export interface IVeracityTokenData {
	/**
	 * The associated scope of this token
	 */
	scope: string

	/**
	 * The id token returned along with the authorization code used to retrieve this access token.
	 */
	idToken: string
	/**
	 * The decoded id token (header and signature not included)
	 */
	idTokenDecoded: IVeracityIDTokenPayload
	/**
	 * The full access token
	 */
	accessToken: string
	/**
	 * The decoded access token payload (header and signature not included)
	 */
	accessTokenDecoded: IVeracityAccessTokenPayload
	/**
	 * The epoch timestamp when the access token expires
	 */
	accessTokenExpires: number
	/**
	 * The lifetime of the access token in milliseconds
	 */
	accessTokenLifetime: number

	/**
	 * The opaque refresh token if offline_access scope was provided
	 */
	refreshToken?: string
	/**
	 * The epoch timestamp when the refresh token expires if refresh token is present
	 */
	refreshTokenExpires?: number
}
