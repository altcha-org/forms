import { AuthorizationCode } from 'simple-oauth2';
import { getAppBaseUrl } from '$lib/server/env';
import { BaseOAuth } from './base.oauth';

export class GoogleOAuth extends BaseOAuth {
	readonly client: AuthorizationCode;

	constructor(
		clientId: string,
		clientSecret: string,
		private scope: string = 'email profile'
	) {
		super();
		this.client = new AuthorizationCode({
			client: {
				id: clientId,
				secret: clientSecret
			},
			auth: {
				tokenHost: 'https://oauth2.googleapis.com',
				tokenPath: '/token',
				authorizeHost: 'https://accounts.google.com',
				authorizePath: '/o/oauth2/v2/auth'
			}
		});
	}

	get callbackUri() {
		return getAppBaseUrl() + '/app/oauth/google/callback';
	}

	async authorize(state?: URLSearchParams) {
		return {
			authorizationUri: this.client.authorizeURL({
				redirect_uri: this.callbackUri,
				scope: this.scope,
				state: state ? state.toString() : ''
			})
		};
	}

	async callback(code: string) {
		const token = await this.client.getToken({
			code,
			redirect_uri: this.callbackUri
		});
		const accessToken = String(token.token.access_token);
		const profile = await this.fetchProfile(accessToken);
		return {
			accessToken,
			profile
		};
	}

	async fetchProfile(accessToken: string) {
		const resp = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
			headers: {
				authorization: 'Bearer ' + accessToken
			}
		});
		if (resp.status !== 200) {
			throw new Error(`Unable to fetch user profile (status ${resp.status}).`);
		}
		const json = await resp.json();
		return {
			email: json.email,
			emailVerified: json.verified_email,
			metadata: {
				id: json.id,
				locale: json.locale,
				url: json.url
			},
			name: json.name
		};
	}
}
