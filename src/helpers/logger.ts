// tslint:disable-next-line: no-var-requires
const Logging = require("passport-azure-ad/lib/logging")
import { ILoggerLike } from '../interfaces'

/**
 * A simple logger singleton class
 * Created in a specific way to allow overwrite of the default logger
 * from "passport-azure-ad" package and to allow users
 * to pass in their own logger
 * Thanks to https://github.com/AzureAD/passport-azure-ad/issues/196
 */
export class CustomLogger {
	private logger: any
	public static instance: CustomLogger
	constructor() {
		if (!!CustomLogger.instance) {
			return CustomLogger.instance
		}
		CustomLogger.instance = this
		return this
	}
	registerLogger(logger?: ILoggerLike) {
		if (logger) this.logger = logger
		return this
	}
	log(level: "info" | "warn" | "error", ...args: any) {
		if (this.logger && this.logger[level]) {
			this.logger[level](...args)
		} else {
			console.log(`[${level.toLocaleUpperCase()}]: `, ...args)
		}
	}
	info(m: string) {
		this.log("info", m)
	}
	warn(m: string) {
		this.log("warn", m)
	}
	error(m: string) {
		this.log("error", m)
	}
	levels(m: string) {
		// TODO: find out when this is called and figure out the correct level
		this.log("info", m)
	}
}

// Overwrite the default logger from "passport-azure-ad"
Logging.getLogger = CustomLogger