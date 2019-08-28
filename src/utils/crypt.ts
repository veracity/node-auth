import crypto from "crypto"

const ALGO = "AES-256-CBC"

export interface ICipherText {
	iv: string
	cipherText: string
}

const hashTo256Bits = (str: string) => {
	const hasher = crypto.createHash("sha256")
	return hasher.update(str).digest("hex")
}

/**
 * Encrypts the provided text using the provided key.
 * Key can be variable length and is hashed using sha256 before encryption begins.
 * @param key The key to use for encryption
 * @param text The text to encrypt
 * @param initializationVector An optional initialization vector for the AES algorithm.
 * If not provided an IV is generated using `crypto.randomBytes(16)`.
 * @returns {iv, cipherText} The IV and encrypted text.
 */
export const encrypt = (key: string, text: string, initializationVector?: Buffer): ICipherText => {
	const iv = initializationVector || crypto.randomBytes(16)
	const keyBuffer = Buffer.from(hashTo256Bits(key), "hex")
	const cipher = crypto.createCipheriv(ALGO, keyBuffer, iv)
	const cipherText = Buffer.concat([cipher.update(text), cipher.final()])
	return {
		iv: iv.toString("hex"),
		cipherText: cipherText.toString("hex")
	}
}
/**
 * Decrypts the provided text using the provided key.
 * Key can be variable length and is hashed using sha256 before encryption begins.
 * @param key The key to use for decryption
 * @param cipherText The cipher text and IV to decrypt
 * @returns string The decrypted text
 */
export const decrypt = (key: string, cipherText: ICipherText) => {
	const iv = Buffer.from(cipherText.iv, "hex")
	const keyBuffer = Buffer.from(hashTo256Bits(key), "hex")
	const cipherTextBuffer = Buffer.from(cipherText.cipherText, "hex")
	const cipher = crypto.createDecipheriv(ALGO, keyBuffer, iv)
	const plainText = Buffer.concat([cipher.update(cipherTextBuffer), cipher.final()])
	return plainText.toString()
}
