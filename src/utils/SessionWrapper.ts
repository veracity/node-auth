import { Request } from "express"

// https://gist.github.com/csanz/1181250/351ea1a7363c8a80944d572c70b769931ee94994

/**
 * This class helps with storing and retrieving data from the current users session in a consisten way.
 */
export class SessionWrapper<DataType = {[key: string]: any}> {
	public constructor(
		private name: string,
		private req: Request
	) {
		if (!req.session) {
			throw new Error("Session support is required. Ensure you have initialized the session property on the request.")
		}

		if (!name.match(/[a-z][a-z0-9]{1,15}/i)) {
			throw new Error("Session name MUST match regex /[a-z][a-z0-9]{1,15}/i")
		}
	}

	public get fullName() {
		return "veracity_session_"+this.name
	}

	public get hasData() {
		return !!this.req.session![this.fullName]
	}

	public get data() {
		return this.req.session![this.fullName] || {}
	}
	public set data(newData: DataType) {
		this.req.session![this.fullName] = newData
	}
	/**
	 * Removes all session data within the namespace of this wrapper.
	 * Does not destroy the session.
	 */
	public clear() {
		this.req.session![this.fullName] = {}
	}
}
