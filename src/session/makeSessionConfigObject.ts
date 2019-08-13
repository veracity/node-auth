import { MemoryStore, SessionOptions, Store } from "express-session"

export interface IMakeSessionConfigObjectOptions {
	/**
	 * A unique string that is used to sign the session id.
	 * This MUST NOT be shared with any other application.
	 */
	secret: string
	/**
	 * A store instance where session data will be stored.
	 * You MUST provide this otherwise express-session will default to using the insecure memory store.
	 */
	store: Store | MemoryStore
}

const recommendedSessionOptions = {
	name: "veracity.session",
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: true
	}
}

/**
 * This function returns an express-session configuration object with the
 * recommended settings applied to it.
 *
 * Usage:
 * const session = require("express-session")
 * app.use(session(configureExpressSession()))
 */
export const makeSessionConfigObject = (options: IMakeSessionConfigObjectOptions & SessionOptions) => {
	const fullOptions = {
		...recommendedSessionOptions,
		...options
	}

	if (!fullOptions) {
		throw new Error("You must specify the options argument.")
	}
	if (!fullOptions.secret) {
		throw new Error("You must specify the secret. It is a required option for express-session")
	}
	if (fullOptions.secret.length < 12) {
		throw new Error("Your secret should be long enough to be secure. > 12 characters is recommended.")
	}
	if (!fullOptions.store) {
		throw new Error("You must specify the store option. Otherwise express-session will default "+
			"to using the insecure memory store.")
	}

	if (options.cookie) {
		fullOptions.cookie = {
			...recommendedSessionOptions.cookie,
			...options.cookie
		}
		if (!fullOptions.cookie.httpOnly) {
			throw new Error("Your cookie must be set to HTTP only to prevent JavaScript from reading it directly")
		}
		if (!fullOptions.cookie.secure) {
			throw new Error("You must set the cookie to only be served over secure connections (HTTPS).")
		}
	}
	if (!fullOptions.name || fullOptions.name === "connect.sid") {
		throw new Error("You must not use the default name for the session cookie as it will reveal to attackers "+
			"details about your implementation that they may use to attack you.")
	}

	return fullOptions
}

export default makeSessionConfigObject
