import { VERACITY_METADATA_ENDPOINT } from "../constants"
import { createRefreshTokenMiddleware, IRefreshConfig } from './createRefreshTokenMiddleware'

const config: IRefreshConfig = {
	identityMetadata: VERACITY_METADATA_ENDPOINT,
	policyName: "some_aname",
	clientID: "asdasdas12432a",
	clientSecret: "5adsadsa",
	scope: "some scope here"
}
const req = {
	user: {
		tokens: {
			services: {
				refresh_token: "asdasda"
			}
		}
	}
} as any
const res: any = ""
jest.mock("./request", () => jest.fn().mockResolvedValue({
	refresh_token: "asdasdasdsadsadasdsada",
	access_token: "atgafuwtehkdas",
	token_endpoint: VERACITY_METADATA_ENDPOINT
}))
jest.mock("axios", () => ({ post: jest.fn().mockResolvedValue({
	data: {
		refresh_token: "asdasdsa",
		access_token: "adasdasdas",
		expires_in: 1000 * 60 * 60 * 60,
		expires_on: Date.now() + 10000
	}
})}))
describe("createRefreshTokenMiddleware", () => {
	it("it does call next()", async () => {
		const refreshTokenMiddleware = createRefreshTokenMiddleware(config)
		expect(refreshTokenMiddleware).toBeDefined()
		const nextFn = jest.fn()
		expect(nextFn.mock.calls.length).toBe(0)
		await refreshTokenMiddleware()(req, res, nextFn)
		expect(nextFn.mock.calls.length).toBe(1)
		expect(nextFn.mock.calls[0]).toEqual([]) // next is called without arguments
	})
	it("does call custom resolver and store token function", async () => {
		const refreshTokenMiddleware = createRefreshTokenMiddleware(config)
		const resolveToken = jest.fn().mockReturnValue("asdasd")
		const storeToken = jest.fn()
		const nextFn = jest.fn()
		await refreshTokenMiddleware(resolveToken, storeToken)(req, res, nextFn)
		expect(resolveToken.mock.calls.length).toBe(1)
		expect(storeToken.mock.calls.length).toBe(1)
		expect(nextFn.mock.calls[0]).toEqual([]) // next is called without arguments
	})
	it("calls next with an argument if the resolve function does not return a token", async () => {
		const refreshTokenMiddleware = createRefreshTokenMiddleware(config)
		const resolveToken = jest.fn().mockReturnValue(undefined)
		const storeToken = jest.fn()
		const nextFn = jest.fn()
		await refreshTokenMiddleware(resolveToken, storeToken)(req, res, nextFn)
		expect(nextFn.mock.calls[0]).toHaveLength(1)
	})
})