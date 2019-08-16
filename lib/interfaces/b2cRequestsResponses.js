"use strict";
// tslint:disable: max-line-length
/**
 * This file contains interfaces for all the responses expected from B2C.
 * Refs:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v1-protocols-openid-connect-code#error-codes-for-authorization-endpoint-errors
 * https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isB2CLoginResponse = (obj) => (obj.id_token && obj.code && obj.state);
exports.isB2CAuthorizationCodeExchangeResponse = (obj) => (obj.not_before && obj.token_type && obj.access_token && obj.expires_in);
exports.isB2CLoginResponseFailure = (obj) => (obj.error && obj.error_description && obj.state);
exports.isB2CResponseFailure = (obj) => (obj.error && obj.error_description);
