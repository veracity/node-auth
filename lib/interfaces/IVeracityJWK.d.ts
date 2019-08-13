/**
 * Describes a Veracity JWK entry.
 */
export interface IVeracityJWK {
    kid: string;
    use: string;
    kty: string;
    e: string;
    n: string;
}
/**
 * Describes a Veracity JWK entry with a generated public key
 */
export interface IVeracityJWKWithPEM extends IVeracityJWK {
    pem: string;
}
