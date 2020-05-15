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
		await refreshTokenMiddleware(req, res, nextFn)
		expect(nextFn.mock.calls.length).toBe(1)
		expect(nextFn.mock.calls[0]).toEqual([]) // next is called without arguments
	})
	// it("does call next with error if request fail", async () => {
	// 	jest.mock("./request", () => jest.fn().mockRejectedValue(new Error("did not work")))
	// 	const refreshTokenMiddleware = createRefreshTokenMiddleware(config)
	// 	const nextFn = jest.fn()
	// 	await refreshTokenMiddleware(req, res, nextFn)
	// 	expect(nextFn.mock.calls.length).toBe(1)
	// 	expect(nextFn.mock.calls[0]).toEqual([]) // next is called without arguments
	// })
	// TODO: test rejected request to get access token
})