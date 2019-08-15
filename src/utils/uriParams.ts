/**
 * Runs encodeURIComponent on every property value of the given parameter object.
 * Returns a new object.
 * @param parameterObject
 */
export const encodeURIParams = (parameterObject: {[key: string]: any}) => (
	Object.keys(parameterObject).reduce<{[key: string]: string}>((encodedObject, key) => {
		encodedObject[key] = encodeURIComponent(parameterObject[key]+"")
		return encodedObject
	}, {})
)
/**
 * Combines every key and value in an object into an array of url query parameters
 * @param parameterObject
 */
export const combineParams = (parameterObject: {[key: string]: string}) => (
	Object.keys(parameterObject).reduce<string[]>((paramArray, key) => {
		paramArray.push(`${key}=${parameterObject[key]}`)
		return paramArray
	}, [])
)
