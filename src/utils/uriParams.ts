/**
 * Runs encodeURIComponent on every property value of the given parameter object.
 * Returns a new object.
 * Undefined values are skipped.
 * @param parameterObject
 */
export const encodeURIParams = <T extends {[key: string]: any}>(parameterObject: T) => (
	Object.keys(parameterObject).reduce<{[key: string]: any}>((encodedObject, key) => {
		if (!parameterObject[key]) {
			return encodedObject
		}
		encodedObject[key] = encodeURIComponent(parameterObject[key]+"")
		return encodedObject
	}, {}) as {[key in keyof typeof parameterObject]: string}
)
/**
 * Combines every key and value in an object into an array of url query parameters.
 * Undefined values are skipped.
 * @param parameterObject
 */
export const combineParams = (parameterObject: {[key: string]: string | undefined}) => (
	Object.keys(parameterObject).reduce<string[]>((paramArray, key) => {
		if (!parameterObject[key]) {
			return paramArray
		}
		paramArray.push(`${key}=${parameterObject[key]}`)
		return paramArray
	}, [])
)
