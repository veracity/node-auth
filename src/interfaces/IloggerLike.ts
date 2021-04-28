export interface ILoggerLike {
	info: (str: any) => void
	warn: (str: any) => void
	error: (str: any) => void
	levels?: (str: any) => void
}