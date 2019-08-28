import base64url from "base64url"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { VIDPError, VIDPErrorSources, VIDPTokenValidationErrorCodes } from "../errors"
import { IVIDPJWTToken } from "../interfaces/IVIDPWTToken"
import { IVIDPJWKWithPEM } from "../internalInterfaces/VIDPReqRes"

const makeVIDPError = (
	code: VIDPTokenValidationErrorCodes,
	description: string,
	details?: any,
	innerError?: Error) => {
	const newError = new VIDPError(
		code, description, VIDPErrorSources.tokenValidation, details, innerError
	)
	if (innerError) {
		newError.stack = innerError.stack
	}
	return newError
}

export interface IValidationOptions extends jwt.VerifyOptions {
	/**
	 * JSON Web Token Keys with public key to verify signatures.
	 */
	jwks: IVIDPJWKWithPEM[]
	/**
	 * If provided will validate that the token matches the given hash.
	 */
	hash?: string

	/**
	 * The id token to validate
	 */
	token: string
}
export const DEFAULT_VALIDATION_OPTIONS: jwt.VerifyOptions = {
	algorithms: ["RS256"],
	clockTolerance: 300
}

/**
 * Performs a complete validation of the provided token based on the validation options.
 * Options not provided are not validated.
 * @param validationOptions
 */
export const validateVIDPToken = <TToken extends IVIDPJWTToken<TPayload> = any, TPayload = any>(
	validationOptions: IValidationOptions) => {
	const {jwks, hash, token, ...jwtValidationOptions} = validationOptions

	if (hash && !validateHash(token, hash)) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.incorrect_hash,
			"The hash of the token did not match the expected hash value",
			{token}
		)
	}

	const tokenSegments = token.split(".")
	if (tokenSegments.length !== 3) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.malfomed_token,
			"The token is not comprised of the expected 3 segments separated by a period.",
			{segmentLength: tokenSegments.length, token}
		)
	}

	const tokenDecoded: TToken | undefined = jwt.decode(token, { complete: true }) as any
	if (!tokenDecoded) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.malfomed_token,
			"The id token is not formatted as a known JWT token. It could not be decoded.",
			{token}
		)
	}

	if (!tokenDecoded.header) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.missing_header, "The token header is missing", {token})
	}
	if (!tokenDecoded.payload) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.missing_payload, "The token payload is missing", {token})
	}
	if (!tokenDecoded.signature) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.missing_signature, "The token signature is missing", {token})
	}

	const tokenJWK = jwks.find((jwk) => jwk.kid === tokenDecoded.header.kid)
	if (!tokenJWK) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.no_such_public_key,
			`Token expected key with kid=${tokenDecoded.header.kid} but no such key was found in metadata.`,
			{token, kid: tokenDecoded.header.kid}
		)
	}

	try {
		jwt.verify(token, tokenJWK.pem, {
			...DEFAULT_VALIDATION_OPTIONS,
			...jwtValidationOptions
		})
	} catch (error) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.verification_error,
			error.message,
			{token, params: {validationOptions, pem: tokenJWK.pem}},
			error
		)
	}

	return {
		token,
		tokenDecoded
	}
}

/**
 * Validates the given authorization code by comparing the given hash value against the hash of the code.
 * @param authorizationCode The code to validate.
 * @param hash The c_hash value from the accompanying ID token.
 */
export const validateVIDPAuthorizationCode = (authorizationCode: string, hash: string) => {
	if (!validateHash(authorizationCode, hash)) {
		throw makeVIDPError(
			VIDPTokenValidationErrorCodes.incorrect_hash,
			"Authorization code hash did not match provided hash",
			{authorizationCode, hash}
		)
	}
	return true
}

/**
 * Intended for use with at_hash or c_hash claims from id tokens.
 * Given a value and a computed hash computes a hash of the value and compares them.
 * @param value The access token or authorization code
 * @param hash The pre-computed hash (at_hash or c_hash claim)
 */
export const validateHash = (value: string, hash: string) => {
	const digest = crypto.createHash("sha256").update(value, "ascii").digest()
	const firstHalfBuffer = Buffer.alloc(digest.length / 2, digest)
	const computedHash = base64url(firstHalfBuffer)
	return hash === computedHash
}
