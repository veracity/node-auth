"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generatePEM_1 = require("./generatePEM");
const request_1 = __importDefault(require("./request"));
/**
 * This function retrieves all metadata for the Veracity tenant in B2C including JWK keys and computes the
 * proper public keys for it.
 * @param options
 */
exports.getVeracityAuthMetadata = async (options) => {
    const metadataEndpoint = `https://login.microsoftonline.com/${options.tenantId}/v2.0/.well-known/openid-configuration?p=${options.policy}`;
    const metadataString = await request_1.default(metadataEndpoint);
    const metadata = JSON.parse(metadataString);
    const jwksString = await request_1.default(metadata.jwks_uri);
    const jwks = JSON.parse(jwksString).keys;
    return {
        ...metadata,
        jwks: jwks.map((aJWK) => ({
            ...aJWK,
            pem: generatePEM_1.generatePEM(aJWK.n, aJWK.e)
        }))
    };
};
/**
 * A memoized version of the auth metadata function that stores the metadata for a configured number of seconds.
 */
exports.getCachedVeracityAuthMetadata = (() => {
    let metadataStore = {};
    const invalidateMetadata = () => {
        if (!metadataStore.metadata)
            return;
        if (!metadataStore.keepUntil)
            return;
        if (Date.now() > metadataStore.keepUntil) {
            metadataStore = {};
        }
    };
    return async (parameters) => {
        invalidateMetadata();
        if (metadataStore.metadata) {
            return metadataStore.metadata;
        }
        const metadata = await exports.getVeracityAuthMetadata(parameters);
        if (parameters.configuration && parameters.configuration.keepMetadataFor) {
            metadataStore = {
                metadata,
                keepUntil: Date.now() + (parameters.configuration.keepMetadataFor * 1000)
            };
        }
        return metadata;
    };
})();
exports.default = exports.getCachedVeracityAuthMetadata;
