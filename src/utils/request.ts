import { CoreOptions } from "request"
import requestPromise from "request-promise-native"

const defaultOptions: CoreOptions = {
	timeout: 10*1000 // in ms
}
/**
 * Wrapper for request that adds default options. All other options are the same
 * @param url
 * @param options
 */
export const request = async (url: string, options: CoreOptions = {}) => {
	const allOptions = { url, ...options, ...defaultOptions }
	const response = await requestPromise(allOptions)
	return response
}
export default request
