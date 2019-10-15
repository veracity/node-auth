import { NextFunction, Request } from "express"
import { IVIDPAccessTokenData } from "./IVIDPAccessToken"

export type RefreshTokenMiddlewareFunc = (
	tokenResolverOrApiScope: (string | ((req: Request) => IVIDPAccessTokenData | Promise<IVIDPAccessTokenData>)),
	refreshStrategy?: ((token: IVIDPAccessTokenData, req: Request) => boolean)
) => ((req: any, res: any, next: NextFunction) => Promise<void>)
