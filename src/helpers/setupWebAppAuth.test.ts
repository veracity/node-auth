import express, { NextFunction, Request, Response } from "express"
import { MemoryStore } from "express-session"
import request, { SuperTest, Test } from "supertest"
import { VERACITY_POLICY, VERACITY_TENANT_ID } from './../constants'
import { setupWebAppAuth } from './setupWebAppAuth'

const refreshMockFn = jest.fn()
jest.mock("../api/createRefreshTokenMiddleware", () => ({
	createRefreshTokenMiddleware: (config: any) => {
		// tslint:disable-next-line: no-unused-expression
		new refreshMockFn(config)
		return (req: Request, res: Response, next: NextFunction) => {
			// tslint:disable-next-line: no-unused-expression
			new refreshMockFn(1)
			next()
		}
	}
}))

let agent: SuperTest<Test>
const refreshMiddlewareConfig = {
	clientID: 'tsdf3245t-sdf32df-234rdfsdf-234fs-243asdasd',
	tenantID: VERACITY_TENANT_ID,
	policyName: VERACITY_POLICY,
	clientSecret: 'w:::1243ewads:::asfasd324',
	scope: 'openid offline_access https://dnvglb2cprod.onmicrosoft.com/83054ebf-1d7b-43f5-82ad-b2bde84d7b75/user_impersonation'
}
describe("setupWebAppAuth", () => {
	beforeAll(() => {
		const app = express()
		const { refreshTokenMiddleware } = setupWebAppAuth({
			app,
			logLevel: "error",
			session: {
				secret: "asdas241tedast3gqeadfadsfafd",
				store: new MemoryStore()
			},
			strategy: {
				clientId: refreshMiddlewareConfig.clientID,
				clientSecret: refreshMiddlewareConfig.clientSecret,
				replyUrl: "https://localhost:3000/auth/oidc/loginreturn"
			}
		})
		app.get("/user", (req, res) => {
			if (req.isAuthenticated()) {
				res.send(req.user)
				return
			}
			res.status(401).send("Unauthorized")
		})
		app.get("/refresh", refreshTokenMiddleware, (req, res, next) => {
			res.send("OK")
		})

		agent = request.agent(app, {})

	})
	it("does throw when config is missing", () => {
		const app = express()
		const config = {
			app,
			logLevel: "error",
			session: {
				secret: "adt3fr352t8q75828497384738928394723",
				store: new MemoryStore()
			},
			strategy: {
				clientId: refreshMiddlewareConfig.clientID,
				clientSecret: refreshMiddlewareConfig.clientSecret,
				replyUrl: "https://localhost:3000/auth/oidc/loginreturn"
			}
		}
		const cloneConfig = () => ({
			...config,
			session: {...config.session},
			strategy: {...config.strategy}
		})
		const throwError = (configuration: any) => () => {
			setupWebAppAuth(configuration)
		}

		const missingApp = cloneConfig()
		delete missingApp.app
		expect(throwError(missingApp)).toThrow(/'app' is required/)

		const missingStrategy = cloneConfig()
		delete missingStrategy.strategy
		expect(throwError(missingStrategy)).toThrow(/'strategy' is required/)

		const missingClientId = cloneConfig()
		delete missingClientId.strategy.clientId
		expect(throwError(missingClientId)).toThrow(/'clientId' is required/)

		const missingReplyUrl = cloneConfig()
		delete missingReplyUrl.strategy.replyUrl
		expect(throwError(missingReplyUrl)).toThrow(/'replyUrl' is required/)
	})
	it("does return Unauthorized on req.isAuthenticated() when not logged in", (done) => {
		agent
			.get('/user')
			.expect('Unauthorized', done)
	})
	it("default loginUrl - redirect with 302", (done) => {
		agent
			.get('/login')
			.expect(302, done)
	})
	it("default logoutUrl - redirect with 302", (done) => {
		agent
			.get("/logout")
			.expect(302, done)
	})
	it("default returnUrl - redirect with 302 ", (done) => {
		agent
			.post('/auth/oidc/loginreturn?p=B2C_1A_SignInWithADFSIdp')
			.expect(302, done)
	})
	it("gives 404 on unknown route", (done) => {
		agent
			.get("/does-not-exist")
			.expect(404, done)
	})
	it("calls createRefreshTokenMiddleware() with correct config and refreshTokenMiddleware() when added", (done) => {
		expect(refreshMockFn.mock.calls[0][0]).toStrictEqual(refreshMiddlewareConfig)
		agent
			.get("/refresh")
			.expect(200)
			.end(() => {
				expect(refreshMockFn.mock.calls[1][0]).toEqual(1)
				done()
			})
	})
})