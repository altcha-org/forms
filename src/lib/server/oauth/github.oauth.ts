import { AuthorizationCode } from 'simple-oauth2';
import { getAppBaseUrl } from '$lib/server/env';
import { BaseOAuth } from './base.oauth';

export class GithubOAuth extends BaseOAuth {
	readonly client: AuthorizationCode;

	constructor(
		clientId: string,
		clientSecret: string,
		private scope: string = 'read:user,user:email'
	) {
		super();
		this.client = new AuthorizationCode({
			client: {
				id: clientId,
				secret: clientSecret
			},
			auth: {
				tokenHost: 'https://github.com',
				tokenPath: '/login/oauth/access_token',
				authorizePath: '/login/oauth/authorize'
			}
		});
	}

	get callbackUri() {
		return getAppBaseUrl() + '/app/oauth/github/callback';
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
		const [profile, email] = await Promise.all([
			this.fetchProfile(accessToken),
			this.fetchEmail(accessToken)
		]);
		return {
			accessToken,
			profile: {
				...email,
				...profile
			}
		};
	}

	async fetchEmail(accessToken: string) {
		const resp = await fetch('https://api.github.com/user/emails', {
			headers: {
				authorization: 'Bearer ' + accessToken
			}
		});
		if (resp.status !== 200) {
			throw new Error(`Unable to fetch user emails (status ${resp.status}).`);
		}
		const json = await resp.json();
		if (!Array.isArray(json)) {
			throw new Error('Invalid server response.');
		}
		const email = json.find(({ primary }) => primary === true);
		return {
			email: email?.email,
			emailVerified: email?.verified
		};
	}

	async fetchProfile(accessToken: string) {
		const resp = await fetch('https://api.github.com/user', {
			headers: {
				authorization: 'Bearer ' + accessToken
			}
		});
		if (resp.status !== 200) {
			throw new Error(`Unable to fetch user profile (status ${resp.status}).`);
		}
		const json = await resp.json();
		return {
			metadata: {
				created_at: json.created_at,
				type: json.type,
				url: json.url
			},
			name: json.name
		};
	}
}
