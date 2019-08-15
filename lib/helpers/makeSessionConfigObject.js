"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var recommendedSessionOptions = {
    name: "veracity.session",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true
    }
};
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
exports.makeSessionConfigObject = function (options) {
    var fullOptions = __assign({}, recommendedSessionOptions, options);
    if (!fullOptions) {
        throw new Error("You must specify the options argument.");
    }
    if (!fullOptions.secret) {
        throw new Error("You must specify the secret. It is a required option for express-session");
    }
    if (fullOptions.secret.length < 12) {
        throw new Error("Your secret should be long enough to be secure. > 12 characters is recommended.");
    }
    if (!fullOptions.store) {
        throw new Error("You must specify the store option. Otherwise express-session will default " +
            "to using the insecure memory store.");
    }
    if (options.cookie) {
        fullOptions.cookie = __assign({}, recommendedSessionOptions.cookie, options.cookie);
        if (!fullOptions.cookie.httpOnly) {
            throw new Error("Your cookie must be set to HTTP only to prevent JavaScript from reading it directly");
        }
        if (!fullOptions.cookie.secure) {
            throw new Error("You must set the cookie to only be served over secure connections (HTTPS).");
        }
    }
    if (!fullOptions.name || fullOptions.name === "connect.sid") {
        throw new Error("You must not use the default name for the session cookie as it will reveal to attackers " +
            "details about your implementation that they may use to attack you.");
    }
    return fullOptions;
};
exports.default = exports.makeSessionConfigObject;
