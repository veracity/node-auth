import {
	IVIDPAuthorizationCodeExchangeResponseFailure,
	IVIDPLoginResponseFailure,
	VIDPErrorCodes
} from "../../internalInterfaces/veracityIDPReqRes"

export class VIDPError extends Error {
	public details: {
		error: VIDPErrorCodes
		description: string
	}
	public constructor(
		detailsOrErrorCode: VIDPErrorCodes | IVIDPLoginResponseFailure | IVIDPAuthorizationCodeExchangeResponseFailure,
		description?: string,
		public innerError?: Error,
		public idToken?: string) {
		super(typeof detailsOrErrorCode === "string" ? description : detailsOrErrorCode.error_description)

		if (typeof detailsOrErrorCode === "string") {
			this.details = {
				error: detailsOrErrorCode,
				description: description || "An unknown error occurred"
			}
		} else {
			this.details = {
				error: detailsOrErrorCode.error,
				description: detailsOrErrorCode.error_description
			}
		}
	}
}
