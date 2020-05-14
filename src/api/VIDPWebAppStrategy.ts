// tslint:disable-next-line: no-var-requires
// require("../helpers/logger")
import { IOIDCStrategyOptionWithRequest, OIDCStrategy, VerifyOIDCFunctionWithReq } from "passport-azure-ad"

export class VIDPWebAppStrategy extends OIDCStrategy {
	constructor(
		options: IOIDCStrategyOptionWithRequest,
		verify: VerifyOIDCFunctionWithReq
	) {
		super(options, verify)
	}
}
