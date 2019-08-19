import base64url from "base64url"
import crypto from "crypto"

/**
 * Intended for use with at_hash or c_hash claims from id tokens.
 * Given a token and a computed hash computes a hash of the token and compares them.
 * @param token The access token or authorization code
 * @param hash The pre-computed hash (at_hash or c_hash claim)
 */
export const validateTokenHash = (token: string, hash: string) => {
	const digest = crypto.createHash("sha256").update(token, "ascii").digest()
	const firstHalfBuffer = Buffer.alloc(digest.length / 2, digest)
	const computedHash = base64url(firstHalfBuffer)
	return hash === computedHash
}
