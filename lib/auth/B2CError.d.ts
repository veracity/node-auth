import { IB2CAuthorizationCodeExchangeResponseFailure, IB2CLoginResponseFailure } from "../interfaces";
export declare class B2CError extends Error {
    constructor(details: IB2CLoginResponseFailure | IB2CAuthorizationCodeExchangeResponseFailure);
}
