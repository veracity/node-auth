import { IVIDPJWTToken, IVIDPJWTTokenData, IVIDPJWTTokenPayloadCommonClaims } from "./IVIDPWTToken"

/**
 * Describes the payload of an access token.
 */
export interface IVIDPAccessTokenPayload extends IVIDPJWTTokenPayloadCommonClaims {
	azp: string
	/**
	 * The users unique ID within Veracity.
	 */
	userId: string
	/**
	 * The account name for the user.
	 */
	dnvglAccountName: string
	/**
	 * The old id for the user.
	 * @deprecated
	 */
	myDnvglGuid: string
	/**
	 * An object id within the Veracity IDP. Do not use this for user identification
	 * @see userId
	 */
	oid: string
	upn: string
	scp: string
}

export interface IVIDPAccessTokenData extends IVIDPJWTTokenData<IVIDPAccessTokenPayload> {
	/**
	 * The scope this token is valid for.
	 */
	scope: string
	/**
	 * If a refresh token was negotiated it will be contained here.
	 */
	refreshToken?: string
}

export interface IVIDPAccessToken extends IVIDPJWTToken<IVIDPAccessTokenPayload> { }