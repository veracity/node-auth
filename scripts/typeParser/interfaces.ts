export interface IProperty {
	name: string
	generics?: string
	propertyName: string
	propertyType: PropertyType
	property: Property[]
	extenders?: string[]
}

export interface IInterfaceProperty {
	name: string
	type: string
	defaultValue: string
	description: string
	interfacePropertyType: InterfacePropertyType
	deprecatedMessage: string
}

export enum InterfacePropertyType {
	required = 0,
	optional = 1,
	deprecated = 2
}

export interface IEnumProperty {
	name: string
	description: string
}

export enum PropertyType {
	enum = 0,
	interface = 1
}

export type Property = IInterfaceProperty | IEnumProperty
