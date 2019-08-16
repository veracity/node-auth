import { CoreOptions } from "request";
/**
 * Wrapper for request that adds default options. All other options are the same
 * @param url
 * @param options
 */
export declare const request: (url: string, options?: CoreOptions) => Promise<any>;
export default request;
