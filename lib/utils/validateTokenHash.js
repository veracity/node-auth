"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var base64url_1 = __importDefault(require("base64url"));
var crypto_1 = __importDefault(require("crypto"));
/**
 * Intended for use with at_hash or c_hash claims from id tokens.
 * Given a token and a computed hash computes a hash of the token and compares them.
 * @param token The access token or authorization code
 * @param hash The pre-computed hash (at_hash or c_hash claim)
 */
exports.validateTokenHash = function (token, hash) {
    var digest = crypto_1.default.createHash("sha256").update(token, "ascii").digest();
    var firstHalfBuffer = Buffer.alloc(digest.length / 2, digest);
    var computedHash = base64url_1.default(firstHalfBuffer);
    return hash === computedHash;
};
