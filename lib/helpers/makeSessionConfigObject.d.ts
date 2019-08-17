/// <reference types="express" />
import { MemoryStore, SessionOptions, Store } from "express-session";
export interface IMakeSessionConfigObjectOptions {
    /**
     * A unique string that is used to sign the session id.
     * This MUST NOT be shared with any other application.
     */
    secret: string;
    /**
     * A store instance where session data will be stored.
     * You MUST provide this otherwise express-session will default to using the insecure memory store.
     */
    store: Store | MemoryStore;
}
/**
 * This function returns an express-session configuration object with the
 * recommended settings applied to it.
 *
 * Usage:
 * const session = require("express-session")
 * app.use(session(configureExpressSession({ ... })))
 *
 * @param options
 * @returns A configuration object for express-session.
 */
export declare const makeSessionConfigObject: (options: IMakeSessionConfigObjectOptions & SessionOptions) => {
    secret: string | (string & string[]);
    store: MemoryStore | Store | (MemoryStore & Store) | (Store & MemoryStore);
    name: string;
    cookie: {
        httpOnly: boolean;
        secure: boolean;
    } | import("express").CookieOptions;
    rolling?: boolean | undefined;
    resave: boolean;
    proxy?: boolean | undefined;
    saveUninitialized: boolean;
    unset?: string | undefined;
};
export default makeSessionConfigObject;
