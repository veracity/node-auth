import { IVeracityJWKWithPEM } from "./IVeracityJWK";
/**
 * Describes the data returned from a direct call to the metadata endpoint
 * using the proper policy parameter.
 */
export interface IVeracityAuthMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint: string;
    jwks_uri: string;
    response_modes_supported: string[];
    response_types_supported: string[];
    scopes_supported: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
    token_endpoint_auth_methods_supported: string[];
    claims_supported: string[];
}
export interface IVeracityAuthMetadataWithJWKs extends IVeracityAuthMetadata {
    jwks: IVeracityJWKWithPEM[];
}
