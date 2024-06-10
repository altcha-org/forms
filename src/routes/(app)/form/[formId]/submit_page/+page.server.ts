import { loadHandler } from '$lib/server/handlers.js';
import type { PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		return {
			error: JSON.parse(event.url.searchParams.get('error') || 'null'),
			formData: JSON.parse(event.url.searchParams.get('data') || '{}'),
			referrer: event.url.searchParams.get('referrer')
		};
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;
