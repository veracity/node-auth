import jwt from "jsonwebtoken"
import { validateTokenHash } from "."
import { IVeracityAccessToken, IVeracityIDToken, IVeracityJWKWithPEM } from "../interfaces"

export interface IValidationOptions {
	/**
	 * The client id from application credentials.
	 */
	clientId: string
	/**
	 * The issuer id from trusted metadata.
	 */
	issuer: string
	/**
	 * JSON Web Token Keys with public key to verify signatures.
	 */
	jwks: IVeracityJWKWithPEM[]
	/**
	 * Nonce for this request.
	 */
	nonce: string

	/**
	 * The ID token
	 */
	idToken: string
}

/**
 * Performs a complete validation of the id token including structure and values.
 * @param validationOptions
 */
export const validateIDToken = (validationOptions: IValidationOptions) => {
	const {clientId, idToken, nonce, issuer, jwks} = validationOptions

	const tokenSegments = idToken.split(".")
	if (tokenSegments.length !== 3) {
		throw new Error("The token is not comprised of the expected 3 segments separated by a period.")
	}

	const decodedIDToken: IVeracityIDToken | undefined = jwt.decode(idToken, { complete: true }) as any
	if (!decodedIDToken) throw new Error("The id token is not formatted as a known JWT token. It could not be decoded.")

	if (!decodedIDToken.header) throw new Error("The id token header is missing")
	if (!decodedIDToken.payload) throw new Error("The id token payload is missing")
	if (!decodedIDToken.signature) throw new Error("The id token signature is missing")

	const idTokenJWK = jwks.find((jwk) => jwk.kid === decodedIDToken.header.kid)
	if (!idTokenJWK) {
		throw new Error(`ID token expected key with kid=${decodedIDToken.header.kid} but no such key was found in metadata.`)
	}

	// Verify id token
	try {
		jwt.verify(idToken, idTokenJWK.pem, {
			nonce,
			audience: clientId,
			algorithms: ["RS256"],
			issuer,
			clockTolerance: 300
		})
	} catch (error) {
		throw new Error("ID token failed validation: "+error.message)
	}

	return {
		idToken,
		decodedIDToken
	}
}
/**
 * Validates an id token and the associated authorization code.
 * @param authorizationCode
 * @param validationOptions
 */
export const validateIDTokenAndAuthorizationCode = (
	authorizationCode: string, validationOptions: IValidationOptions) => {
	const {decodedIDToken} = validateIDToken(validationOptions)
	if (!decodedIDToken.payload.c_hash) {
		throw new Error("Expected c_hash claim on the id token, but it was not present. Cannot verify authorization code.")
	}
	if (!validateTokenHash(authorizationCode, decodedIDToken.payload.c_hash)) {
		throw new Error("Authorization code hash did not match expected value from c_hash claim on id token.")
	}
	return decodedIDToken
}
/**
 * Validates an id token and the associated access token.
 * @param accessToken
 * @param validationOptions
 */
export const validateIDTokenAndAccessCode = (
	accessToken: string, validationOptions: IValidationOptions) => {
	const {idToken, issuer, nonce, jwks} = validationOptions

	const {decodedIDToken} = validateIDToken(validationOptions)
	if (!decodedIDToken.payload.at_hash) {
		throw new Error("Expected at_hash claim on the id token, but it was not present. Cannot verify access token.")
	}
	if (!validateTokenHash(accessToken, decodedIDToken.payload!.at_hash)) {
		throw new Error("Access token hash did not match expected value from at_hash claim on id token.")
	}

	const decodedAccessToken: IVeracityAccessToken | undefined = jwt.decode(accessToken, { complete: true }) as any
	if (!decodedAccessToken) {
		throw new Error("The access token is not formatted as a known JWT token. It could not be decoded.")
	}

	if (!decodedAccessToken.header) throw new Error("The id token header is missing")
	if (!decodedAccessToken.payload) throw new Error("The id token payload is missing")
	if (!decodedAccessToken.signature) throw new Error("The id token signature is missing")

	const accessTokenJWK = jwks.find((jwk) => jwk.kid === decodedAccessToken.header.kid)
	if (!accessTokenJWK) {
		throw new Error(`Access token expected key with kid=${decodedAccessToken.header.kid} `+
			`but no such key was found in metadata.`)
	}

	// Verify access token
	try {
		jwt.verify(accessToken, accessTokenJWK.pem, {
			nonce,
			algorithms: ["RS256"],
			issuer,
			clockTolerance: 300
		})
	} catch (error) {
		throw new Error("Access token failed validation: "+error.message)
	}

	return {
		idToken,
		decodedIDToken,
		accessToken,
		decodedAccessToken
	}
}
