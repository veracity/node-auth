"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VeracityAuthFlowStrategyContext_1 = require("./VeracityAuthFlowStrategyContext");
/**
 * Defines a strategy for authenticating with Veracity and aquiring access tokens using the
 * Authorization Code grant flow.
 *
 * It supports negotiating for multiple access tokens for different services (api scopes).
 */
class VeracityAuthFlowStrategy {
    constructor(settings, verifier) {
        this.settings = settings;
        this.verifier = verifier;
    }
    /**
     * Used for internal calls to the methods provided by PassportJs.
     * This ensures typings work correctly.
     */
    get self() {
        return this;
    }
    async authenticate(req, options) {
        if (!req.session) {
            this.self.error(new Error("Session support is required for this Veracity strategy. " +
                "Please ensure sessions are enabled before authenticating."));
            return;
        }
        try {
            const context = new VeracityAuthFlowStrategyContext_1.VeracityAuthFlowStrategyContext(req, this.settings);
            const nextResult = await context.next();
            if (!nextResult) {
                return this.verifier({
                    idToken: context.idToken,
                    idTokenDecoded: context.idTokenDecoded,
                    apiTokens: context.readyTokens
                }, this.done.bind(this));
            }
            this.self.redirect(nextResult);
        }
        catch (error) {
            this.self.error(error);
        }
    }
    /**
     * The done function to send to the verifier once the request authentication process completes successfully.
     */
    done(err, user, info) {
        if (err)
            return this.self.error(err);
        if (!user)
            return this.self.fail(info);
        this.self.success(user, info);
    }
}
exports.VeracityAuthFlowStrategy = VeracityAuthFlowStrategy;
