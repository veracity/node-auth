export interface IVeracityTokenHeader {
    typ: string;
    alg: string;
    kid: string;
}
interface ICommonClaims {
    iss: string;
    sub: "Not supported currently. Use oid claim.";
    aud: string;
    exp: number;
    nbf: number;
    iat: number;
    email: string[];
    nonce: string;
    given_name: string;
    family_name: string;
    name: string;
    ver: "1.0";
}
export interface IVeracityIDTokenPayload extends ICommonClaims {
    c_hash?: string;
    at_hash?: string;
    acr: string;
    auth_time: number;
    userId: string;
    dnvglAccountName: string;
    myDnvglGuid: string;
    oid: string;
    upn: string;
}
export interface IVeracityAccessTokenPayload extends ICommonClaims {
    azp: string;
    userId: string;
    dnvglAccountName: string;
    myDnvglGuid: string;
    oid: string;
    upn: string;
    scp: string;
}
export interface IVeracityIDToken {
    header: IVeracityTokenHeader;
    payload: IVeracityIDTokenPayload;
    signature: string;
}
export interface IVeracityAccessToken {
    header: IVeracityTokenHeader;
    payload: IVeracityAccessTokenPayload;
    signature: string;
}
export {};
