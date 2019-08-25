import {
	IInterfaceProperty,
	InterfacePropertyType,
	IProperty
} from "./interfaces"

const interfaceTypeToString = (interfaceType: InterfacePropertyType) => {
	switch (interfaceType) {
		case InterfacePropertyType.optional:
			return "❔"
		case InterfacePropertyType.deprecated:
			return "⬇️"
	}
	return ""
}
const propNameToString = (prop: IInterfaceProperty) =>
	`${prop.name}${interfaceTypeToString(prop.interfacePropertyType)}`+
	`${prop.defaultValue ? ` <br>=${prop.defaultValue.trim()}` : ""}`

const propsToMarkdownTableRows = (props: IInterfaceProperty[]) => {
	const table = `Property|Type|Description
-|-|-
`
	return table + props.map((prop) => {
		return [
			`${propNameToString(prop)}`,
			prop.type.trim(),
			prop.description
		].join("|")
	}).join("\n")
}

export const typeToMarkdown = (prop: IProperty, headingPrefix: string = "###") => {
	return `${headingPrefix} ${prop.name}
${prop.extenders ? `*extends ${prop.extenders.join(", ")}*` : ""}
${propsToMarkdownTableRows(prop.property as IInterfaceProperty[])}
`
}
export const typesToMarkdown = (props: IProperty[], headingPrefix: string = "###") =>
	props.map((prop) => typeToMarkdown(prop, headingPrefix)).join("\n")
