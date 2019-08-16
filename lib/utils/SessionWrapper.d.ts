import { Request } from "express";
/**
 * This class helps with storing and retrieving data from the current users session in a consisten way.
 */
export declare class SessionWrapper<DataType = {
    [key: string]: any;
}> {
    private name;
    private req;
    constructor(name: string, req: Request);
    readonly fullName: string;
    readonly hasData: boolean;
    data: DataType;
    /**
     * Clears all session data within the namespace of this wrapper.
     * Does not destroy the session.
     */
    clear(): void;
    /**
     * Removes the entire namespace for this wrapper from the session object.
     */
    destroyNamespace(): void;
}
