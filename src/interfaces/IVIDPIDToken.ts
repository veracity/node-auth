import { IVIDPJWTToken, IVIDPJWTTokenData, IVIDPJWTTokenPayloadCommonClaims } from "./IVIDPWTToken"

export interface IVIDPIDTokenPayload extends IVIDPJWTTokenPayloadCommonClaims {
	/**
	 * Hash of the accompanying authorization code if this token is part of an authorization code flow.
	 */
	c_hash?: string

	/**
	 * Hash of the accompanying access token if this was part of an access token exchange.
	 */
	at_hash?: string
	acr: string

	auth_time: number
	/**
	 * The unique Veracity ID of the user.
	 */
	userId: string
	dnvglAccountName: string
	/**
	 * Legacy Veracity ID of the user. Use userId claim instead.
	 * @deprecated
	 */
	myDnvglGuid: string
	/**
	 * The object id within the Veracity IDP.
	 * Do not use this for user identification as it is not propagated to other Veracity services.
	 */
	oid: string
	upn: string
}

export interface IVIDPIDTokenData extends IVIDPJWTTokenData<IVIDPIDTokenPayload> { }

export interface IVIDPIDToken extends IVIDPJWTToken<IVIDPIDTokenPayload> { }
