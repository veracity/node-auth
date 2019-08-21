/**
 * Defines some basic token refresh strategies.
 */
export const tokenRefreshStrategies = {
	/**
	 * Enables refresh if the token has less than half its lifetime remaining.
	 * This is the default strategy.
	 */
	halfLifetime: (issued: number, expiresAt: number, ttl: number) => {
		return (expiresAt - (Date.now()/1000)) < (ttl / 2)
	},
	/**
	 * Enables refresh if the token has less than five minutes lifetime remaining.
	 */
	lessThan5Minutes: (issued: number, expiresAt: number, ttl: number) => {
		return (expiresAt - (Date.now()/1000)) < 60*5
	}
}
