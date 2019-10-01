import { Router } from "express"

/**
 * A simplified router interface that only contains the properties required for the helper functions
 */
export interface IRouterLike extends Pick<Router, "use" | "get" | "post"> { }
