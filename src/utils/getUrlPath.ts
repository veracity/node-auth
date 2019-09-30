/**
 * Returns the path section of an absolute url.
 * @param absoluteUrl The absolute url to extract path from.
 */
export const getUrlPath = (absoluteUrl: string) => {
	try {
		const parsed = new URL(absoluteUrl)
		return parsed.pathname
	} catch (error) {
		throw new Error("The url was not absolute or parsing failed: "+error.message)
	}
}
