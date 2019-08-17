import { IVeracityTokenData } from "./IVeracityTokenData";
import { IVeracityIDTokenPayload } from "./veracityTokens";
export interface IVeracityAuthFlowStrategyVerifierOptions {
    /**
     * The full ID token
     */
    idToken: string;
    /**
     * The decoded ID token payload (header and signature not included)
     */
    idTokenDecoded: IVeracityIDTokenPayload;
    /**
     * Contains all access tokens and associated refresh tokens negotiated by the system.
     * Tokens are indexed by the scope string.
     * If no api scopes were provided in the strategy settings this will not be defined.
     */
    apiTokens?: {
        [scope: string]: IVeracityTokenData;
    };
}
/**
 * The done() function is given as the second argument to your verifier. You should call it to report on the
 * result of the verification process.
 *
 * done(null, user) <- If verification succeeded, user is the object you want to store on req.user
 * done(error) <- If an error occurs during verification. It supports proper Error objects
 */
export declare type DoneFunction<TUser> = (err: any, user: TUser | null, info?: any) => void;
/**
 * The verifier function is called once the authentication process is completed successfully.
 * This is where you would look up additional info to augment the user object with if needed.
 * Once this is done call the provided done function with the final user object as the second argument.
 */
export declare type VerifierFunction<TUser> = (options: IVeracityAuthFlowStrategyVerifierOptions, done: DoneFunction<TUser>) => void | Promise<void>;
