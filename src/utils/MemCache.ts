interface IStoreEntry<TData = any> {
	data: TData
	timeout?: number
}

export interface IMemCache {
	set<TData>(
		key: string,
		data: TData,
		lifetime?: number,
		onExpire?: ((key: string, data: TData, store: this) => any)): TData
	remove(key: string): void
	get<TData = any>(key: string): TData | undefined
}

/**
 * Simple short-term memory cache class.
 * Used to cache
 */
export class MemCache implements IMemCache {
	private _store: {[key: string]: IStoreEntry} = {}

	/**
	 * Store data in the memory cache. Overrides any data existing on the provided key.
	 * @param key The key to store the data under
	 * @param data The actual data to store
	 * @param [lifetime] The number of milliseconds the data should be stored for before it expires.
	 * If negative store forever.
	 * @param [onExpire] If defined this function is called once the data expires instead of simply clearing the data.
	 * This function is then responsible for clearing the cache data using `store.clear(key)`
	 */
	public set<TData>(
		key: string,
		data: TData,
		lifetime: number = 120000,
		onExpire?: (key: string, data: TData, store: this) => any): TData {
		this.remove(key)
		let timeout: any
		if (lifetime >= 0) {
			timeout = setTimeout(() => {
				if (onExpire) {
					onExpire(key, data, this)
					return
				}
				this.remove(key)
			}, lifetime)
		}
		this._store[key] = {
			data,
			timeout
		}
		return data
	}
	public remove(key: string) {
		const entry = this._store[key]
		if (entry) {
			clearTimeout(entry.timeout)
		}
		delete this._store[key]
	}
	public get<TData = any>(key: string) {
		return (this._store[key] ? this._store[key].data : undefined) as TData | undefined
	}
}

export const memCacheInstance = new MemCache()
