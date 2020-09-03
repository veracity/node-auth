import { IDefaultAuthConfig, IFullAuthConfig, ISetupWebAppAuthSettings } from "../interfaces"

export const mergeConfig = (defaultConfig: IDefaultAuthConfig, endUserConfig: Omit<ISetupWebAppAuthSettings, "app">): IFullAuthConfig => {
	const { onBeforeLogin, onLoginComplete, onLoginError, onLogout, onVerify, name, logLevel, loginPath, logoutPath, policyName, errorPath } = endUserConfig
	const config = {
		...defaultConfig,
		oidcConfig: {
			...defaultConfig.oidcConfig,
			clientID: endUserConfig.strategy.clientId,
			clientSecret: endUserConfig.strategy.clientSecret,
			redirectUrl: endUserConfig.strategy.replyUrl,
			scope: endUserConfig.strategy.apiScopes ? endUserConfig.strategy.apiScopes : defaultConfig.oidcConfig.scope,
			identityMetadata: endUserConfig.strategy.metadataURL ? endUserConfig.strategy.metadataURL : defaultConfig.oidcConfig.identityMetadata
		},
		session: endUserConfig.session
	}
	config.oidcConfig.loggingLevel = logLevel || defaultConfig.logLevel
	if (onBeforeLogin) config.onBeforeLogin = onBeforeLogin
	if (onLoginComplete) config.onLoginComplete = onLoginComplete
	if (onLoginError) config.onLoginError = onLoginError
	if (onLogout) config.onLogout = onLogout
	if (onVerify) config.onVerify = onVerify
	if (name) config.name = name
	if (loginPath) config.loginPath = loginPath
	if (logoutPath) config.logoutPath = logoutPath
	if (errorPath) config.errorPath = errorPath
	if (policyName) config.policyName = policyName
	return config
}

export const validateConfig = (config: ISetupWebAppAuthSettings) => {
	if (!config.app) throw new Error("'app' is required in config.")
	if (!config.strategy) throw new Error("'strategy' is required in config.")
	if (!config.strategy.clientId) throw new Error("'clientId' is required in strategy config.")
	if (!config.strategy.replyUrl) throw new Error("'replyUrl' is required in strategy config.")
}