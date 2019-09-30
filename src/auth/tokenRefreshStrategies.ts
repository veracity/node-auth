import { IVIDPAccessTokenData } from "../interfaces"

const nowInSeconds = () => Date.now() / 1000

export const lessThanXMinutes = (minutes: number) => (token: IVIDPAccessTokenData) => {
	return token.expires - nowInSeconds() <= minutes * 60
}
export const lessThan5Mintes = lessThanXMinutes(5)
export const lessThanHalfLifetime = (token: IVIDPAccessTokenData) => {
	return token.expires - nowInSeconds() < (token.lifetime / 2)
}
