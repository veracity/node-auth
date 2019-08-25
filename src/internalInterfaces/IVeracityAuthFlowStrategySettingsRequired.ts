import { IVeracityAuthFlowStrategySettings } from "../interfaces/IVeracityAuthFlowStrategySettings"

export interface IVeracityAuthFlowStrategySettingsRequired extends IVeracityAuthFlowStrategySettings {
	tenantId: string
	policy: string
	logoutRedirectUrl: string
}
