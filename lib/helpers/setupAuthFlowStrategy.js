"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const VeracityAuthFlowStrategy_1 = require("../auth/VeracityAuthFlowStrategy");
const defaultAuthFlowStrategySettings_1 = require("./defaultAuthFlowStrategySettings");
const makeSessionConfigObject_1 = __importDefault(require("./makeSessionConfigObject"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const getUrlPath = (absoluteUrl) => {
    try {
        const parsed = new URL(absoluteUrl);
        return parsed.pathname;
    }
    catch (error) {
        throw new Error("The url was not absolute or parsing failed: " + error.message);
    }
};
/**
 * This function helps you set up everything needed to authenticate with Veracity.
 * It uses the recommeded default settings for all configurations.
 * You should call this function as soon as you have an express application instance available.
 * You need to ensure you have the following npm packages installed before proceeding:
 *
 * - express
 * - express-session
 * - passport
 * - body-parser
 *
 * They are set as optional dependencies of this library.
 */
exports.setupAuthFlowStrategy = (options) => {
    const { appOrRouter: app, loginPath, onLoginVerifier, onLoginComplete, strategySettings, sessionSettings } = options;
    const name = "veracityauthflow";
    app.use(express_session_1.default(makeSessionConfigObject_1.default((sessionSettings))));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    const allStrategySettings = {
        ...defaultAuthFlowStrategySettings_1.defaultAuthFlowStrategySettings,
        ...strategySettings
    };
    passport_1.default.use(name, new VeracityAuthFlowStrategy_1.VeracityAuthFlowStrategy(allStrategySettings, onLoginVerifier));
    passport_1.default.serializeUser((user, done) => { done(null, user); });
    passport_1.default.deserializeUser((id, done) => { done(null, id); });
    app.get(loginPath, passport_1.default.authenticate(name), (req, res) => {
        res.send({
            message: "If you can see this please copy everything on this page " +
                "and report the error on https://github.com/veracity/node-veracity-auth/issues"
        });
    });
    app.post(getUrlPath(strategySettings.redirectUri), body_parser_1.default.urlencoded({ extended: true }), passport_1.default.authenticate(name), onLoginComplete);
};
