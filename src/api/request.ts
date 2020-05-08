// tslint:disable: max-classes-per-file
import { CoreOptions } from "request"
import requestPromise from "request-promise-native"

export class RequestConnectTimeoutError extends Error {
	public constructor(public url: string, public innerError: Error) {
		super(`Request to "${url}" failed to connect withint the given timeout.`)
	}
}
export class RequestReadTimeoutError extends Error {
	public constructor(public url: string, public innerError: Error) {
		super(`Request to "${url}" timed out before server could send a proper response.`)
	}
}

const defaultOptions: CoreOptions = {
	timeout: 10*1000 // in ms
}
/**
 * Wrapper for request that adds default options. All other options are the same
 * @param url
 * @param options
 */
export const request = async <TResponse = any>(url: string, options: CoreOptions = {}) => {
	const allOptions = { url, ...options, ...defaultOptions }
	try {
		const response = await requestPromise(allOptions)
		return response as TResponse
	} catch (error) {
		if (error.code === "ETIMEDOUT") {
			// throw new VIDPError(
			// 	error.connect ? VIDPRequestErrorCodes.connect_timeout : VIDPRequestErrorCodes.read_timeout,
			// 	error.connect ? "Request timed out while waiting for a connection" :
			// 		"Request timed out while waiting for a server response",
			// 	VIDPErrorSources.request,
			// 	{},
			// 	error
			// )
			// TODO: Better error handling
			throw new Error("Request timed out while waiting for a connection")
		}
		throw error
	}
}
export default request