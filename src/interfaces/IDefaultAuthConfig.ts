import { NextFunction, Request, Response } from "express"
import { IOIDCStrategyOptionWithRequest, VerifyOIDCFunctionWithReq } from "passport-azure-ad"
import { VIDPError } from "../errors"
import { IMakeSessionConfigObjectOptions } from "../helpers/makeSessionConfigObject"

interface IOIDCStrategyOption extends Omit<IOIDCStrategyOptionWithRequest, "scope" | "clientSecret" | "passReqToCallback"> {
	scope?: string[]
	clientSecret?: string
	passReqToCallback: true
}

export interface IDefaultAuthConfig {
	loginPath: string
	logoutPath: string
	errorPath: string
	logLevel?: "error"
	name: string
	oidcConfig: Omit<IOIDCStrategyOption, "clientID" | "redirectUrl">
	policyName: string
	destroySessionUrl: string
	destroyADFSSessionUrl: string
	tenantID: string
	onLogout: (req: Request, res: Response, next: NextFunction) => void
	onBeforeLogin: (req: Request, res: Response, next: NextFunction) => void
	onVerify: VerifyOIDCFunctionWithReq
	onLoginComplete: (req: Request, res: Response, next: NextFunction) => void
	onLoginError: (err: VIDPError, req: Request, res: Response, next: NextFunction) => void
}

export interface IFullAuthConfig extends Omit<IDefaultAuthConfig, "oidcConfig"> {
	oidcConfig: IOIDCStrategyOption
	session: IMakeSessionConfigObjectOptions
}
