import { IVIDPAuthorizationCodeExchangeResponseFailure, IVIDPLoginResponseFailure } from "../../interfaces";
export declare class VIDPError extends Error {
    constructor(details: IVIDPLoginResponseFailure | IVIDPAuthorizationCodeExchangeResponseFailure);
}
