import {
	IInterfaceProperty,
	InterfacePropertyType,
	IProperty
} from "./interfaces"

const interfaceTypeToString = (interfaceType: InterfacePropertyType) => {
	switch (interfaceType) {
		case InterfacePropertyType.optional:
			return "?"
		case InterfacePropertyType.deprecated:
			return "⬇"
	}
	return ""
}
const escapePipe = (str: string) => str.replace("|", "\\|")
const propNameToString = (prop: IInterfaceProperty) =>
	`${prop.name}${interfaceTypeToString(prop.interfacePropertyType)}`+
	`${prop.defaultValue ? `<br>=${prop.defaultValue.trim()}` : ""}`

const propsToMarkdownTableRows = (props: IInterfaceProperty[]) => {
	const table = `Property|Type|Description
-|-|-
`
	return table + props.map((prop) => {
		return [
			`${escapePipe(propNameToString(prop))}`,
			escapePipe(prop.type.trim()),
			escapePipe(prop.description.replace(/(\n|\r|\n\r)\s*/, "<br>"))
		].join("|")
	}).join("\n")
}

export const typeToMarkdown = (prop: IProperty, headingPrefix: string = "###") => {
	return `${headingPrefix} ${prop.name}
${prop.generics ? "*"+prop.generics+"* " : ""}${prop.extenders ? `*extends ${prop.extenders.join(", ")}*\n` : "\n"}
${propsToMarkdownTableRows(prop.property as IInterfaceProperty[])}
`
}
export const typesToMarkdown = (props: IProperty[], headingPrefix: string = "###") =>
	props.map((prop) => typeToMarkdown(prop, headingPrefix)).join("\n")
