/**
 * Intended for use with at_hash or c_hash claims from id tokens.
 * Given a token and a computed hash computes a hash of the token and compares them.
 * @param token The access token or authorization code
 * @param hash The pre-computed hash (at_hash or c_hash claim)
 */
export declare const validateTokenHash: (token: string, hash: string) => boolean;
