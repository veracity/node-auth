"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Runs encodeURIComponent on every property value of the given parameter object.
 * Returns a new object.
 * @param parameterObject
 */
exports.encodeURIParams = (parameterObject) => (Object.keys(parameterObject).reduce((encodedObject, key) => {
    encodedObject[key] = encodeURIComponent(parameterObject[key] + "");
    return encodedObject;
}, {}));
/**
 * Combines every key and value in an object into an array of url query parameters
 * @param parameterObject
 */
exports.combineParams = (parameterObject) => (Object.keys(parameterObject).reduce((paramArray, key) => {
    paramArray.push(`${key}=${parameterObject[key]}`);
    return paramArray;
}, []));
