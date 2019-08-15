import { CoreOptions, UrlOptions } from "request"
import request from "request-promise-native"
import { mockAuthFlowStrategySettings } from "../../test/mockAuthFlowStrategySettings"
import {
	endpointJWK,
	endpointMeta,
	mockFullMetadata,
	mockJWKResponse,
	mockMetaResponse
} from "../../test/mockB2CResponses"
import getVeracityAuthMetadataDefault, { getVeracityAuthMetadata } from "./getVeracityAuthMetadata"

const {tenantId, policy} = mockAuthFlowStrategySettings

jest.mock("request-promise-native")
const requestMock: jest.Mock = request as any

requestMock.mockImplementation((options: UrlOptions & CoreOptions) => {
	const {url} = options
	if (url === endpointMeta) {
		return Promise.resolve(JSON.stringify(mockMetaResponse))
	}
	if (url === endpointJWK) {
		return Promise.resolve(JSON.stringify(mockJWKResponse))
	}

	throw new Error(`Endpoint url not mocked "${url}"`)
})

describe("getVeracityAuthMetadata", () => {
	it("should be defined", () => {
		expect(typeof getVeracityAuthMetadata).toBe("function")
		expect(typeof getVeracityAuthMetadataDefault).toBe("function")
	})
	it("should export named and default", () => {
		expect(getVeracityAuthMetadata).toBe(getVeracityAuthMetadataDefault)
	})
	it("should respond with a properly formatted metadata object", async () => {
		const result = await getVeracityAuthMetadata({ tenantId, policy })
		expect(result).toEqual(mockFullMetadata)
	})
})
