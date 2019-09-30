import { MemoryStore, Store } from "express-session"
import { decrypt, encrypt, ICipherText } from "../utils/crypt"

/**
 * Encrypts all specified properties of the given object with the given key unless they are undefined.
 * @param encryptionKey
 * @param objectToEncrypt
 * @param propsToEncrypt
 */
const encryptSessionData = (encryptionKey: string, objectToEncrypt: {[key: string]: any}, propsToEncrypt: string[]) => {
	if (!objectToEncrypt || propsToEncrypt.length === 0) return undefined

	const encryptedObject = propsToEncrypt.reduce<{[prop: string]: ICipherText}>((acc, prop) => {
		if (typeof objectToEncrypt[prop] !== "undefined") {
			acc[prop] = encrypt(encryptionKey, JSON.stringify(objectToEncrypt[prop]))
		}
		return acc
	}, {})

	return encryptedObject
}
/**
 * Decrypts all specified properties of the given object with the given key unless they are not `ICipherText`
 * properties.
 * @param decryptionKey
 * @param objectToDecrypt
 * @param propsToDecrypt
 */
const decryptSessionData = (decryptionKey: string, objectToDecrypt: {[key: string]: any}, propsToDecrypt: string[]) => {
	if (!objectToDecrypt || propsToDecrypt.length === 0) return undefined
	const decryptedObject = propsToDecrypt.reduce<{[prop: string]: any}>((acc, prop) => {
		const possibleCipherText: ICipherText = objectToDecrypt[prop]
		if (possibleCipherText && possibleCipherText.iv && possibleCipherText.cipherText) {
			acc[prop] = JSON.parse(decrypt(decryptionKey, possibleCipherText))
		}
		return acc
	}, {})

	return decryptedObject
}

/**
 * This function takes any compatible express-session store instance and augments it with an encryption
 * mechanism that will use AES-256-CBC along with the provided key to seamlessly encrypt and decrypt session
 * data on the fly. Only the specified keys will be encrypted, their values replaced with an encrypted string.
 * @param encryptionKey An encryption key to use when encrypting and decrypting (hashed with SHA256 before use)
 * @param keysToEncrypt An array of the keys to encrypt in the session object.
 */
export const createEncryptedSessionStore = (encryptionKey: string, keysToEncrypt: string[] = ["passport"]) =>
	<TStore extends Store | MemoryStore>(store: TStore): TStore => {
	const anyStore: any = store
	if (store.all) {
		const realAll = store.all
		store.all = (callback: any) => {
			const cb = (err: any, sessions: any) => {
				if (err || !sessions || sessions.length === 0) {
					callback(err, sessions)
					return
				}

				const decryptedSessions = sessions.map((session: any) => {
					const decryptedSessionProps = decryptSessionData(encryptionKey, session, keysToEncrypt)
					Object.assign(session, decryptedSessionProps || {})
					return session
				})
				callback(err, decryptedSessions)
			}
			return realAll.call(store, cb)
		}
		anyStore.all.__real = realAll
	}
	if (store.get) {
		const realGet = store.get
		store.get = (sid: any, callback: any) => {
			const cb = (err: any, session: any) => {
				if (!session || !!err) {
					callback(err, session)
					return
				}

				const decryptedSessionProps = decryptSessionData(encryptionKey, session, keysToEncrypt)
				Object.assign(session, decryptedSessionProps || {})
				callback(err, session)
			}
			return realGet.call(store, sid, cb)
		}
		anyStore.get.__real = realGet
	}
	if (store.set) {
		const realSet = store.set
		store.set = (sid: any, session: any, callback: any) => {
			const encryptedProps = encryptSessionData(encryptionKey, session, keysToEncrypt)
			const sessionData = {
				...session,
				...(encryptedProps || {})
			}
			return realSet.call(store, sid, sessionData, callback)
		}
		anyStore.set.__real = realSet
	}
	return store
}
