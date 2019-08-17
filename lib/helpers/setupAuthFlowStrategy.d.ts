import { RequestHandler, Router } from "express-serve-static-core";
import { IVeracityAuthFlowStrategySettings, VerifierFunction } from "../interfaces";
import { IMakeSessionConfigObjectOptions } from "./makeSessionConfigObject";
export interface ISetupAuthFlowOptions<TUser = any> {
    /**
     * Required to attach passport and session middleware as well as setting up your authentication routes.
     * Usually this is an express application instance, but a router is also supported.
     */
    appOrRouter: Router;
    /**
     * Specify the url path where users can log in. E.g.: /auth/login
     */
    loginPath: string;
    /**
     * A function that is called once the user has completely logged in.
     * Here you can specify how the user object will look when it's attached to req.user
     */
    onLoginVerifier: VerifierFunction<TUser>;
    /**
     * The handler to call when the login has completed.
     */
    onLoginComplete: RequestHandler;
    /**
     * Define all required settings to set up the Veracity authentication strategy.
     */
    strategySettings: Omit<IVeracityAuthFlowStrategySettings, "tenantId" | "policy" | "requestRefreshToken" | "configuration">;
    /**
     * Define required settings for the session middleware.
     */
    sessionSettings: IMakeSessionConfigObjectOptions;
}
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
export declare const setupAuthFlowStrategy: <TUser = any>(options: ISetupAuthFlowOptions<any>) => void;
