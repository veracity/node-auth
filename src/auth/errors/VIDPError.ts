import { IVIDPAuthorizationCodeExchangeResponseFailure, IVIDPLoginResponseFailure } from "../../interfaces"

export class VIDPError extends Error {
	public constructor(details: IVIDPLoginResponseFailure | IVIDPAuthorizationCodeExchangeResponseFailure) {
		super(details.error_description)
		Object.assign(this, details)
	}
}
