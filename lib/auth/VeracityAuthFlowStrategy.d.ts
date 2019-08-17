import { Request } from "express";
import { Strategy, StrategyCreatedStatic } from "passport";
import { IVeracityAuthFlowStrategySettings, VerifierFunction } from "../interfaces";
/**
 * Defines a strategy for authenticating with Veracity and aquiring access tokens using the
 * Authorization Code grant flow.
 *
 * It supports negotiating for multiple access tokens for different services (api scopes).
 */
export declare class VeracityAuthFlowStrategy<TUser = any> implements Strategy {
    private settings;
    private verifier;
    /**
     * Used for internal calls to the methods provided by PassportJs.
     * This ensures typings work correctly.
     */
    readonly self: StrategyCreatedStatic;
    name?: string;
    constructor(settings: IVeracityAuthFlowStrategySettings, verifier: VerifierFunction<TUser>);
    authenticate(req: Request, options?: any): Promise<void>;
    /**
     * The done function to send to the verifier once the request authentication process completes successfully.
     */
    private done;
}
export default VeracityAuthFlowStrategy;
