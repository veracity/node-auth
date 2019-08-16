"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const _1 = require(".");
/**
 * Performs a complete validation of the id token including structure and values.
 * @param validationOptions
 */
exports.validateIDToken = (validationOptions) => {
    const { clientId, idToken, nonce, issuer, jwks } = validationOptions;
    const tokenSegments = idToken.split(".");
    if (tokenSegments.length !== 3) {
        throw new Error("The token is not comprised of the expected 3 segments separated by a period.");
    }
    const decodedIDToken = jsonwebtoken_1.default.decode(idToken, { complete: true });
    if (!decodedIDToken)
        throw new Error("The id token is not formatted as a known JWT token. It could not be decoded.");
    if (!decodedIDToken.header)
        throw new Error("The id token header is missing");
    if (!decodedIDToken.payload)
        throw new Error("The id token payload is missing");
    if (!decodedIDToken.signature)
        throw new Error("The id token signature is missing");
    const idTokenJWK = jwks.find((jwk) => jwk.kid === decodedIDToken.header.kid);
    if (!idTokenJWK) {
        throw new Error(`ID token expected key with kid=${decodedIDToken.header.kid} but no such key was found in metadata.`);
    }
    // Verify id token
    try {
        jsonwebtoken_1.default.verify(idToken, idTokenJWK.pem, {
            nonce,
            audience: clientId,
            algorithms: ["RS256"],
            issuer,
            clockTolerance: 300
        });
    }
    catch (error) {
        throw new Error("ID token failed validation: " + error.message);
    }
    return {
        idToken,
        decodedIDToken
    };
};
/**
 * Validates an id token and the associated authorization code.
 * @param authorizationCode
 * @param validationOptions
 */
exports.validateIDTokenAndAuthorizationCode = (authorizationCode, validationOptions) => {
    const { decodedIDToken } = exports.validateIDToken(validationOptions);
    if (!decodedIDToken.payload.c_hash) {
        throw new Error("Expected c_hash claim on the id token, but it was not present. Cannot verify authorization code.");
    }
    if (!_1.validateTokenHash(authorizationCode, decodedIDToken.payload.c_hash)) {
        throw new Error("Authorization code hash did not match expected value from c_hash claim on id token.");
    }
    return decodedIDToken;
};
/**
 * Validates an id token and the associated access token.
 * @param accessToken
 * @param validationOptions
 */
exports.validateIDTokenAndAccessCode = (accessToken, validationOptions) => {
    const { idToken, issuer, nonce, jwks } = validationOptions;
    const { decodedIDToken } = exports.validateIDToken(validationOptions);
    if (!decodedIDToken.payload.at_hash) {
        throw new Error("Expected at_hash claim on the id token, but it was not present. Cannot verify access token.");
    }
    if (!_1.validateTokenHash(accessToken, decodedIDToken.payload.at_hash)) {
        throw new Error("Access token hash did not match expected value from at_hash claim on id token.");
    }
    const decodedAccessToken = jsonwebtoken_1.default.decode(accessToken, { complete: true });
    if (!decodedAccessToken) {
        throw new Error("The access token is not formatted as a known JWT token. It could not be decoded.");
    }
    if (!decodedAccessToken.header)
        throw new Error("The id token header is missing");
    if (!decodedAccessToken.payload)
        throw new Error("The id token payload is missing");
    if (!decodedAccessToken.signature)
        throw new Error("The id token signature is missing");
    const accessTokenJWK = jwks.find((jwk) => jwk.kid === decodedAccessToken.header.kid);
    if (!accessTokenJWK) {
        throw new Error(`Access token expected key with kid=${decodedAccessToken.header.kid} ` +
            `but no such key was found in metadata.`);
    }
    // Verify access token
    try {
        jsonwebtoken_1.default.verify(accessToken, accessTokenJWK.pem, {
            nonce,
            algorithms: ["RS256"],
            issuer,
            clockTolerance: 300
        });
    }
    catch (error) {
        throw new Error("Access token failed validation: " + error.message);
    }
    return {
        idToken,
        decodedIDToken,
        accessToken,
        decodedAccessToken
    };
};
