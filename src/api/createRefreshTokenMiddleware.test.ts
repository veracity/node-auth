import { createRefreshTokenMiddleware, IRefreshConfig } from './createRefreshTokenMiddleware'

const config: IRefreshConfig = {
	tenantID: "asasdasd",
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
jest.mock("./request", () => jest.fn().mockResolvedValue(JSON.stringify({
	refresh_token: "asdasdasdsadsadasdsada",
	access_token: "atgafuwtehkdas"
})))
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