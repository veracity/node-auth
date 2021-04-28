/**
 * Serializes an object to string while avoiding circular references
 * @param obj The object to stringify
 * @param indent Optional indentation to use
 */
export const safeStringify = (obj: any, indent?: number, funcContent: boolean = false) => {
	const cache: any[] = []
	return JSON.stringify(obj, (key, value) => {
		if (typeof value === "function") {
			return funcContent ? value.toString() : "{function()}"
		}
		if (typeof value === "object" && value !== null) {
			if (value instanceof RegExp) {
				return value.toString()
			}
			if (cache.indexOf(value) !== -1) {
					// Circular reference found, discard key
					return "{circular}"
			}
			// Store value in our collection
			cache.push(value)
		}
		return value
	}, indent)
}