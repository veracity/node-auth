"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const defaultOptions = {
    timeout: 10 * 1000 // in ms
};
/**
 * Wrapper for request that adds default options. All other options are the same
 * @param url
 * @param options
 */
exports.request = async (url, options = {}) => {
    const allOptions = { url, ...options, ...defaultOptions };
    const response = await request_promise_native_1.default(allOptions);
    return response;
};
exports.default = exports.request;
