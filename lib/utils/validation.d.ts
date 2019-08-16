import { IVeracityAccessToken, IVeracityIDToken, IVeracityJWKWithPEM } from "../interfaces";
export interface IValidationOptions {
    /**
     * The client id from application credentials.
     */
    clientId: string;
    /**
     * The issuer id from trusted metadata.
     */
    issuer: string;
    /**
     * JSON Web Token Keys with public key to verify signatures.
     */
    jwks: IVeracityJWKWithPEM[];
    /**
     * Nonce for this request.
     */
    nonce: string;
    /**
     * The ID token
     */
    idToken: string;
}
/**
 * Performs a complete validation of the id token including structure and values.
 * @param validationOptions
 */
export declare const validateIDToken: (validationOptions: IValidationOptions) => {
    idToken: string;
    decodedIDToken: IVeracityIDToken;
};
/**
 * Validates an id token and the associated authorization code.
 * @param authorizationCode
 * @param validationOptions
 */
export declare const validateIDTokenAndAuthorizationCode: (authorizationCode: string, validationOptions: IValidationOptions) => IVeracityIDToken;
/**
 * Validates an id token and the associated access token.
 * @param accessToken
 * @param validationOptions
 */
export declare const validateIDTokenAndAccessCode: (accessToken: string, validationOptions: IValidationOptions) => {
    idToken: string;
    decodedIDToken: IVeracityIDToken;
    accessToken: string;
    decodedAccessToken: IVeracityAccessToken;
};
