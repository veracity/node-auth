import { IVeracityAuthFlowStrategySettings } from "../src/interfaces"

export const mockAuthFlowStrategySettings: IVeracityAuthFlowStrategySettings = {
	tenantId: "dummy-tenant-id",
	policy: "dummy-policy",
	clientId: "dummy-client-id",
	clientSecret: "dummy-client-secret",
	redirectUri: "https://dummy-redirect-uri.com",
	requestRefreshTokens: true,
	apiScopes: [
		"mock-scope-1",
		"mock-scope-2"
	],
	configuration: {
		keepMetadataFor: 120
	}
}
