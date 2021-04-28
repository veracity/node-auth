// tslint:disable-next-line: no-var-requires
const Logging = require("passport-azure-ad/lib/logging")
import { ILoggerLike } from '../interfaces'

export type LogLevel = "info" | "warn" | "error"

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
	public defaultLogLevel: LogLevel = "error"
	public logLevel: LogLevel | undefined
	constructor(logLevel?: LogLevel) {
		if (CustomLogger.instance) {
			if (logLevel) {
				const isAcceptedLogLevel = ["info", "warn", "error"].includes(logLevel)
				if (!CustomLogger.instance.logLevel && isAcceptedLogLevel) { // set logging level if it's valid and not already set
					CustomLogger.instance.logLevel = logLevel
				}
				if (!isAcceptedLogLevel) CustomLogger.instance.info(logLevel) // to catch messages from library sent in constructor
			}
			return CustomLogger.instance
		}
		CustomLogger.instance = this
		return this
	}
	get loggingLevel() {
		return this.logLevel || this.defaultLogLevel
	}
	registerLogger(logger?: ILoggerLike) {
		if (logger) this.logger = logger
		return this
	}
	log(level: LogLevel, m: string) {
		// make sure we follow the log level set by the user
		if (this.loggingLevel === "warn" && level === "info") return
		if (this.loggingLevel === "error" && ["info", "warn"].includes(level)) return
		if (this.logger && this.logger[level]) {
			this.logger[level](m)
		} else {
			console.log(`[@veracity/node-auth:${level.toLocaleUpperCase()}]: ` + m)
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
	levels(notUsed: string, logLevel: LogLevel) {
		// unused method, but since the library is using it, it must stay
	}
}

// Overwrite the default logger from "passport-azure-ad"
Logging.getLogger = CustomLogger