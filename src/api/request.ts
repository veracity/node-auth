// tslint:disable: max-classes-per-file
import axios, { AxiosRequestConfig } from "axios"
import { VIDPError, VIDPErrorSources } from "../errors"
import { VIDPRequestErrorCodes } from './../interfaces/VIDPErrorCode'

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

/**
 * Wrapper for request that adds default options. All other options are the same
 * @param url
 * @param options
 */
export const request = async <T>(options: AxiosRequestConfig) => {
	if (!options.timeout) options.timeout = 10*1000 // in ms
	try {
		const response = await axios(options)
		return response.data as T
	} catch (error) {
		if (error.code === "ETIMEDOUT") {
			throw new VIDPError(
				error.connect ? VIDPRequestErrorCodes.connect_timeout : VIDPRequestErrorCodes.read_timeout,
				error.connect ? "Request timed out while waiting for a connection" :
					"Request timed out while waiting for a server response",
				VIDPErrorSources.request,
				{},
				error
			)
		}
		throw error
	}
}
export default request