import { Store } from "express-session"
import omit from "lodash.omit"
import makeSessionConfigObjectDefault, { makeSessionConfigObject } from "./makeSessionConfigObject"

const anymakeSessionConfigObject: any = makeSessionConfigObject

const dummyStore: Store = {} as any
const safeDummyOptions = {
	secret: "dummy.session.secret",
	store: dummyStore
}

describe("makeSessionConfigObject", () => {
	it("should be defined", () => {
		expect(typeof makeSessionConfigObject).toBe("function")
		expect(typeof makeSessionConfigObjectDefault).toBe("function")
	})
	it("should export both named and default", () => {
		expect(makeSessionConfigObject).toBe(makeSessionConfigObjectDefault)
	})
	it("should return a proper session config object", () => {
		const actual = makeSessionConfigObject(safeDummyOptions)
		expect(actual).toEqual({
			name: "veracity.session",
			secret: "dummy.session.secret",
			resave: false,
			saveUninitialized: false,
			store: dummyStore,
			cookie: {
				httpOnly: true,
				secure: true
			}
		})
	})
	it("should combine cookie options", () => {
		const actual = makeSessionConfigObject({
			...safeDummyOptions,
			cookie: {
				domain: "localhost"
			}
		})
		expect(actual).toEqual({
			name: "veracity.session",
			secret: "dummy.session.secret",
			resave: false,
			saveUninitialized: false,
			store: dummyStore,
			cookie: {
				httpOnly: true,
				secure: true,
				domain: "localhost"
			}
		})
	})
	describe("validation cases", () => {
		it("throws if no options defined", () => {
			expect(() => anymakeSessionConfigObject()).toThrow()
			expect(() => anymakeSessionConfigObject(safeDummyOptions)).not.toThrow()
		})
		it("throws if default name is used", () => {
			expect(() => anymakeSessionConfigObject({
				...safeDummyOptions,
				name: "connect.sid"
			})).toThrow()
		})
		it("throws if no secret", () => {
			const options = omit(safeDummyOptions, ["secret"])
			expect(() => anymakeSessionConfigObject(options)).toThrow()
		})
		it("throws if secret is too short", () => {
			const options = {
				...safeDummyOptions,
				secret: "too-short"
			}
			expect(() => anymakeSessionConfigObject(options)).toThrow()
		})
		it("throws if no store", () => {
			const options = omit(safeDummyOptions, ["store"])
			expect(() => anymakeSessionConfigObject(options)).toThrow()
		})
		it("throws if cookie not secure", () => {
			expect(() => anymakeSessionConfigObject({
				...safeDummyOptions,
				cookie: {
					secure: false
				}
			})).toThrow()
			expect(() => anymakeSessionConfigObject({
				...safeDummyOptions,
				cookie: {
					secure: true
				}
			})).not.toThrow()
		})
		it("throws if cookie not httpOnly", () => {
			expect(() => anymakeSessionConfigObject({
				...safeDummyOptions,
				cookie: {
					httpOnly: false
				}
			})).toThrow()
			expect(() => anymakeSessionConfigObject({
				...safeDummyOptions,
				cookie: {
					httpOnly: true
				}
			})).not.toThrow()
		})
	})
})
