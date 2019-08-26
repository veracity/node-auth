import { MemoryStore, Store } from "express-session"

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
