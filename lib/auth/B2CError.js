"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class B2CError extends Error {
    constructor(details) {
        super(details.error_description);
        Object.assign(this, details);
    }
}
exports.B2CError = B2CError;
