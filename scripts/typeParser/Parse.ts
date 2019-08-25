/* tslint:disable:no-trailing-whitespace */
/* tslint:disable:no-object-literal-type-assertion */
/* tslint:disable:no-conditional-assignment */

import { EnumParserHelper } from "./EnumParserHelper"
import { InterfaceParserHelper } from "./InterfaceParserHelper"
import { IEnumProperty, IInterfaceProperty, IProperty, PropertyType } from "./interfaces"

const _parseExtends = (extendsString: string): (string[] | undefined) => {
	if (!extendsString) {
		return undefined
	}

	const extendedInterfacesString = extendsString.trim().substr("extends ".length)
	return extendedInterfacesString.split(/,[\s\t]*/g)
}

function _parseEnumOrInterface(regexResult: RegExpExecArray): IInterfaceProperty[] | IEnumProperty[] {
	let parseInfo: IInterfaceProperty[] | IEnumProperty[]
	if (regexResult[1] === "interface") {
		const parser = new InterfaceParserHelper(regexResult[0])
		parseInfo = parser.parse()
	} else {
		const parser = new EnumParserHelper(regexResult[0])
		parseInfo = parser.parse()
	}
	return parseInfo
}

/**
 * Given some valid, well linted Typescript source code, extracts exported interfaces and enums.
 *
 * Note: requires that the closing '}' of interfaces and enums is the first char on its own line.
 *       It should otherwise be reasonably robust to handle various commenting or even code layout
 *       styles within the interface or enum.
 *
 * To specify default values for interfaces, use the JSDoc @default or @defaultvalue markup.
 * The rest of the line after @default will be captured as the default value.
 *
 * @export
 * @param {string} source Valid, reasonably well linted Typescript source code.
 * @param {string} [propsInterfaceOrEnumName] Name of an interface or enum if you only want to parse
 * said interface or enum.
 * @returns {Array<IProperty>} An array of properties.
 */
export function parse(source: string, propsInterfaceOrEnumName?: string): IProperty[] {
	const props: IProperty[] = []
	let regex: RegExp | null = null
	let parseInfo

	const propertyNameSuffix = (type: string) => type === "interface" ? " interface" : " enum"
	const propertyType = (type: string) => type === "interface" ? PropertyType.interface : PropertyType.enum

	if (propsInterfaceOrEnumName) {
		regex = new RegExp(`export (interface|enum) ${propsInterfaceOrEnumName}(?: extends .*?)? \\{(.*[\\r\\n]*)*?\\}`)
		const regexResult = regex.exec(source)
		if (regexResult && regexResult.length > 0) {
			parseInfo = _parseEnumOrInterface(regexResult)
			return [{
				name: propsInterfaceOrEnumName,
				propertyName: propsInterfaceOrEnumName + propertyNameSuffix(regexResult[1]),
				propertyType: propertyType(regexResult[1]),
				property: parseInfo
			} as IProperty]
		}
	} else {
		regex = new RegExp(`export (interface|enum) (\\S*?)( extends .*?)?\\s*\\{(.*[\\r\\n]*)*?\\}`, "g")
		let regexResult: RegExpExecArray | null
		const results: IProperty[] = []
		while ((regexResult = regex.exec(source)) !== null) {
			parseInfo = _parseEnumOrInterface(regexResult)
			results.push({
				name: regexResult[2],
				extenders: _parseExtends(regexResult[3]),
				propertyName: regexResult[2] + propertyNameSuffix(regexResult[1]),
				propertyType: propertyType(regexResult[1]),
				property: parseInfo
			} as IProperty)
		}

		return results
	}

	return props
}
