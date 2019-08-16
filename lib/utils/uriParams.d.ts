/**
 * Runs encodeURIComponent on every property value of the given parameter object.
 * Returns a new object.
 * @param parameterObject
 */
export declare const encodeURIParams: (parameterObject: {
    [key: string]: any;
}) => {
    [key: string]: string;
};
/**
 * Combines every key and value in an object into an array of url query parameters
 * @param parameterObject
 */
export declare const combineParams: (parameterObject: {
    [key: string]: string;
}) => string[];
