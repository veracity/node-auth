"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://gist.github.com/csanz/1181250/351ea1a7363c8a80944d572c70b769931ee94994
/**
 * This class helps with storing and retrieving data from the current users session in a consisten way.
 */
class SessionWrapper {
    constructor(name, req) {
        this.name = name;
        this.req = req;
        if (!req.session) {
            throw new Error("Session support is required. Ensure you have initialized the session property on the request.");
        }
        if (!name.match(/[a-z][a-z0-9]{1,15}/i)) {
            throw new Error("Session name MUST match regex /[a-z][a-z0-9]{1,15}/i");
        }
    }
    get fullName() {
        return "veracity_session_" + this.name;
    }
    get hasData() {
        return !!this.req.session[this.fullName];
    }
    get data() {
        return this.req.session[this.fullName] || {};
    }
    set data(newData) {
        this.req.session[this.fullName] = newData;
    }
    /**
     * Clears all session data within the namespace of this wrapper.
     * Does not destroy the session.
     */
    clear() {
        this.req.session[this.fullName] = {};
    }
    /**
     * Removes the entire namespace for this wrapper from the session object.
     */
    destroyNamespace() {
        delete this.req.session[this.fullName];
    }
}
exports.SessionWrapper = SessionWrapper;
