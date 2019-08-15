import { IB2CAuthorizationCodeExchangeResponseFailure, IB2CLoginResponseFailure } from "../interfaces"

export class B2CError extends Error {
	public constructor(details: IB2CLoginResponseFailure | IB2CAuthorizationCodeExchangeResponseFailure) {
		super(details.error_description)
		Object.assign(this, details)
	}
}
