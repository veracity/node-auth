"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VIDPError extends Error {
    constructor(details) {
        super(details.error_description);
        Object.assign(this, details);
    }
}
exports.VIDPError = VIDPError;
