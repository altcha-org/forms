import { redirect } from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { loadHandler } from '$lib/server/handlers';
import type { LayoutServerLoad } from './$types';

export const load = loadHandler(
	({ locals }) => {
		if (!locals.user) {
			throw redirect(303, '/app/authentication');
		}
		return {
			appVersion: env.VERSION,
			hideLicenseLink: env.LICENSE_HIDE === '1',
			privacyPolicyUrl: env.PRIVACY_POLICY_URL,
			termsOfServiceUrl: env.TERMS_OF_SERVICE_URL,
			region: env.REGION
		};
	},
	{
		authorization: false
	}
) satisfies LayoutServerLoad;
