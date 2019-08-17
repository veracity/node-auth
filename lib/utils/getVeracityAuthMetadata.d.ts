import { IVeracityAuthFlowStrategySettings, IVeracityAuthMetadataWithJWKs } from "../interfaces";
export interface IVeracityMetadataOptions {
    /**
     * The id of the B2C tenant used for Veracity authentication.
     */
    tenantId: string;
    /**
     * The name of the policy to use when authenticating with the Veracity B2C tenant.
     */
    policy: string;
}
/**
 * This function retrieves all metadata for the Veracity tenant in B2C including JWK keys and computes the
 * proper public keys for it.
 * @param options
 */
export declare const getVeracityAuthMetadata: (options: IVeracityMetadataOptions) => Promise<IVeracityAuthMetadataWithJWKs>;
/**
 * A memoized version of the auth metadata function that stores the metadata for a configured number of seconds.
 */
export declare const getCachedVeracityAuthMetadata: (parameters: Pick<IVeracityAuthFlowStrategySettings, "tenantId" | "policy" | "configuration">) => Promise<IVeracityAuthMetadataWithJWKs>;
export default getCachedVeracityAuthMetadata;
