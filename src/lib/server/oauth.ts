import { GoogleOAuth } from '$lib/server/oauth/google.oauth';
import { GithubOAuth } from '$lib/server/oauth/github.oauth';
import { env } from '$lib/server/env';
import type { BaseOAuth } from './oauth/base.oauth';

export const AVAILABLE_OAUTH_PROVIDERS = Object.entries({
	google: !!env.OAUTH_GOOGLE_CLIENT_ID?.length && !!env.OAUTH_GOOGLE_CLIENT_SECRET?.length,
	github: !!env.OAUTH_GITHUB_CLIENT_ID?.length && !!env.OAUTH_GITHUB_CLIENT_SECRET?.length
})
	.filter(([_, ok]) => ok)
	.map(([name]) => name);

const providers: Map<string, BaseOAuth> = new Map();

export function getOAuthProvider(provider: string) {
	if (!providers.has(provider)) {
		if (!AVAILABLE_OAUTH_PROVIDERS.includes(provider)) {
			throw new Error(`OAuth provider ${provider} not configured.`);
		}
		switch (provider) {
			case 'google':
				providers.set(
					provider,
					new GoogleOAuth(env.OAUTH_GOOGLE_CLIENT_ID!, env.OAUTH_GOOGLE_CLIENT_SECRET!)
				);
				break;
			case 'github':
				providers.set(
					provider,
					new GithubOAuth(env.OAUTH_GITHUB_CLIENT_ID!, env.OAUTH_GITHUB_CLIENT_SECRET!)
				);
				break;
			default:
				throw new Error('Unrecognized OAuth provider.');
		}
	}
	return providers.get(provider)!;
}
