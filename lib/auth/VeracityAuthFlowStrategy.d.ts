import { Request } from "express";
import { Strategy, StrategyCreatedStatic } from "passport";
import { IVeracityAuthFlowStrategySettings, IVeracityIDTokenPayload, IVeracityTokenData } from "../interfaces";
export interface IVeracityAuthFlowVerifierOptions {
    idToken: IVeracityIDTokenPayload;
    apiTokens?: {
        [apiScope: string]: IVeracityTokenData;
    };
}
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
    constructor(settings: IVeracityAuthFlowStrategySettings, verifier: (options: IVeracityAuthFlowVerifierOptions, done: (err: any, user: TUser | null, info?: any) => void) => void | Promise<void>);
    authenticate(req: Request, options?: any): Promise<void>;
    /**
     * The done function to send to the verifier once the request authentication process completes successfully.
     */
    private done;
}
