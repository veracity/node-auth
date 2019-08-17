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
    const idTokenDecoded = jsonwebtoken_1.default.decode(idToken, { complete: true });
    if (!idTokenDecoded)
        throw new Error("The id token is not formatted as a known JWT token. It could not be decoded.");
    if (!idTokenDecoded.header)
        throw new Error("The id token header is missing");
    if (!idTokenDecoded.payload)
        throw new Error("The id token payload is missing");
    if (!idTokenDecoded.signature)
        throw new Error("The id token signature is missing");
    const idTokenJWK = jwks.find((jwk) => jwk.kid === idTokenDecoded.header.kid);
    if (!idTokenJWK) {
        throw new Error(`ID token expected key with kid=${idTokenDecoded.header.kid} but no such key was found in metadata.`);
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
        idTokenDecoded
    };
};
/**
 * Validates an id token and the associated authorization code.
 * @param authorizationCode
 * @param validationOptions
 */
exports.validateIDTokenAndAuthorizationCode = (authorizationCode, validationOptions) => {
    const { idTokenDecoded } = exports.validateIDToken(validationOptions);
    if (!idTokenDecoded.payload.c_hash) {
        throw new Error("Expected c_hash claim on the id token, but it was not present. Cannot verify authorization code.");
    }
    if (!_1.validateTokenHash(authorizationCode, idTokenDecoded.payload.c_hash)) {
        throw new Error("Authorization code hash did not match expected value from c_hash claim on id token.");
    }
    return idTokenDecoded;
};
/**
 * Validates an id token and the associated access token.
 * @param accessToken
 * @param validationOptions
 */
exports.validateIDTokenAndAccessToken = (accessToken, validationOptions) => {
    const { idToken, issuer, nonce, jwks } = validationOptions;
    const { idTokenDecoded } = exports.validateIDToken(validationOptions);
    if (!idTokenDecoded.payload.at_hash) {
        throw new Error("Expected at_hash claim on the id token, but it was not present. Cannot verify access token.");
    }
    if (!_1.validateTokenHash(accessToken, idTokenDecoded.payload.at_hash)) {
        throw new Error("Access token hash did not match expected value from at_hash claim on id token.");
    }
    const accessTokenDecoded = jsonwebtoken_1.default.decode(accessToken, { complete: true });
    if (!accessTokenDecoded) {
        throw new Error("The access token is not formatted as a known JWT token. It could not be decoded.");
    }
    if (!accessTokenDecoded.header)
        throw new Error("The id token header is missing");
    if (!accessTokenDecoded.payload)
        throw new Error("The id token payload is missing");
    if (!accessTokenDecoded.signature)
        throw new Error("The id token signature is missing");
    const accessTokenJWK = jwks.find((jwk) => jwk.kid === accessTokenDecoded.header.kid);
    if (!accessTokenJWK) {
        throw new Error(`Access token expected key with kid=${accessTokenDecoded.header.kid} ` +
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
        idTokenDecoded,
        accessToken,
        accessTokenDecoded
    };
};
