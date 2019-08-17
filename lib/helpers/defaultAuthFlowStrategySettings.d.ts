/**
 * These are the default settings recommeded for authenticating with Veracity.
 * You can combine these with your applications custom settings to quickly get up and running.
 */
export declare const defaultAuthFlowStrategySettings: {
    tenantId: string;
    policy: string;
    apiScopes: string[];
    requestRefreshTokens: boolean;
    configuration: {
        keepMetadataFor: number;
    };
};
