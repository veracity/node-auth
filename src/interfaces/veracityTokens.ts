export interface IVeracityTokenHeader {
	typ: string
	alg: string
	kid: string
}

export interface IVeracityIDTokenPayload {
	exp: number
	nbf: number
	ver: "1.0"
	iss: string
	sub: "Not supported currently. Use oid claim."
	aud: string
	acr: string
	nonce: string
	iat: number
	auth_time: number
	userId: string
	given_name: string
	family_name: string
	name: string
	dnvglAccountName: string
	myDnvglGuid: string
	oid: string
	email: string[]
	upn: string
	c_hash?: string
	at_hash?: string
}

export interface IVeracityAccessTokenPayload {
	iss: string
	exp: number
	nbf: number
	aud: string
	userId: string
	given_name: string
	family_name: string
	name: string
	dnvglAccountName: string
	myDnvglGuid: string
	sub: "Not supported currently. Use oid claim."
	oid: string
	email: string[]
	upn: string
	nonce: string
	scp: string
	azp: string
	ver: "1.0"
	iat: number
}

export interface IVeracityIDToken {
	header: IVeracityTokenHeader
	payload: IVeracityIDTokenPayload
	signature: string
}
export interface IVeracityAccessToken {
	header: IVeracityTokenHeader
	payload: IVeracityAccessTokenPayload
	signature: string
}
