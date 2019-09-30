import crypto from "crypto"
import { decrypt, encrypt } from "./crypt"

describe("crypt", () => {
	it("exports encrypt() and decrypt()", () => {
		expect(typeof encrypt).toBe("function")
		expect(typeof decrypt).toBe("function")
	})
	it("encrypts text", () => {
		expect(() => {
			encrypt("key", "text")
		}).not.toThrow()
	})
	it("encrypts and decrypts with same key", () => {
		const key = "shuivuianrileuhskjfgskfgweifgsiahfb"
		const text = "This is the secret text that we intend to encrypt"
		const cipherText = encrypt(key, text)
		const plainText = decrypt(key, cipherText)
		expect(text).toEqual(plainText)
	})
	it("encrypts and decrypts with provided IV", () => {
		const key = "dsjkfhskjdafhi"
		const iv = crypto.randomBytes(16)
		const text = "Text encrypted with fixed IV"
		const cipherText = encrypt(key, text, iv)
		const plainText = decrypt(key, {
			iv: iv.toString("hex"),
			cipherText: cipherText.cipherText
		})
		expect(cipherText.iv).toEqual(iv.toString("hex"))
		expect(plainText).toEqual(text)
	})
	it("encrypt and decrypt matches known input/output", () => {
		const key = "key"
		const iv = Buffer.from("c78d423d93ceb383d8ade9dc99c9b2ae", "hex")
		const text = "Hello world"
		expect(encrypt(key, text, iv).cipherText).toEqual("0ff98eff0c765928a22c09f5c30c7800")
		expect(decrypt(key, {
			iv: iv.toString("hex"),
			cipherText: "0ff98eff0c765928a22c09f5c30c7800"
		})).toEqual(text)
	})
})
