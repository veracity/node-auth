export interface IVIDPConfiguration {
	/**
	 * Your applications client id from the Veracity for Developers Project Portal.
	 */
	clientID: string
	/**
	 * One of your applications reply urls from the Veracity for Developers Portal.
	 */
	replyURL: string
}

export interface IVIDPWebAppConfiguration extends IVIDPConfiguration {
	/**
	 * Your applications client secret fromt he Veracity for Developers Project Portal.
	 */
	clientSecret: string
}
