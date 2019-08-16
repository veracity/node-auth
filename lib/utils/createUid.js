"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nanoid_1 = __importDefault(require("nanoid"));
/**
 * Generates a unique string that can serve as an id or nonce.
 * This is an alias for nanoid to abstract away the library dependency.
 */
exports.createUid = () => (nanoid_1.default());
