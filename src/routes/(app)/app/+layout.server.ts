import { env, getAppBaseUrl } from '$lib/server/env';
import { loadHandler } from '$lib/server/handlers';
import { rateLimit } from '$lib/server/ratelimiter';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const ssr = false;

export const load = loadHandler(
	async (event) => {
		await rateLimit('L1', event);
		const device = event.locals.device;
		const user = event.locals.user;
		return {
			appVersion: env.VERSION,
			availableRegions: env.AVAILABLE_REGIONS.split(',')
				.filter((region) => !!region)
				.map((region) => {
					return {
						region,
						url: getAppBaseUrl(region)
					};
				}),
			device: device
				? {
						id: device.id,
						name: device.name,
						encryptionKey: device.encryptionKey
					}
				: null,
			privacyPolicyUrl: env.PRIVACY_POLICY_URL,
			termsOfServiceUrl: env.TERMS_OF_SERVICE_URL,
			region: env.REGION,
			user: user
				? {
						accounts: user.accountsToUsers,
						id: user.id,
						email: user.email,
						emailVerified: user.emailVerified,
						name: user.name,
						createdAt: user.createdAt
					}
				: null
		};
	},
	{
		authorization: false
	}
) satisfies LayoutServerLoad;
