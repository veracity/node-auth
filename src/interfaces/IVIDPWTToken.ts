export interface IVIDPJWTTokenHeader {
	/**
	 * The type of token this is.
	 */
	typ: string
	/**
	 * The message authentication code algorithm.
	 */
	alg: string
	/**
	 * The id of the key used to sign this token.
	 */
	kid: string
}

/**
 * A general Veracity IDP json-web-token object.
 */
export interface IVIDPJWTTokenData<TPayload> {
	/**
	 * The full token string
	 */
	token: string

	/**
	 * Header information from the token
	 */
	header: IVIDPJWTTokenHeader

	/**
	 * The token payload
	 */
	payload: TPayload

	/**
	 * Unix timestamp for when the token was issued.
	 */
	issued: number
	/**
	 * The number of seconds this token is valid for.
	 */
	lifetime: number
	/**
	 * Unix timestamp for when the token expires.
	 */
	expires: number
}

// Known claims: https://www.iana.org/assignments/jwt/jwt.xhtml

export interface IVIDPJWTTokenPayloadCommonClaims {
	/**
	 * Issuer
	 */
	iss: string
	/**
	 * Subject
	 */
	sub: "Not supported currently. Use oid claim."
	/**
	 * Audience
	 */
	aud: string
	/**
	 * Expiration time.
	 */
	exp: number
	/**
	 * Not valid before time.
	 */
	nbf: number
	/**
	 * Issued at time.
	 */
	iat: number
	email: string[]
	nonce: string
	given_name: string
	family_name: string
	name: string

	ver: "1.0"
}

export interface IVIDPJWTToken<TPayload> {
	header: IVIDPJWTTokenHeader
	payload: TPayload
	signature: string
}