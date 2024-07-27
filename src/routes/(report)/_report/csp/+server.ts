import { requestHandler } from '$lib/server/handlers';
import { rateLimit } from '$lib/server/ratelimiter';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

export const POST = requestHandler(
	async (event) => {
		await rateLimit('L3', event);
		const body = await event.request.json();
		if (body['csp-report']) {
			logger.warn('CSP REPORT %o', body);
		}
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
