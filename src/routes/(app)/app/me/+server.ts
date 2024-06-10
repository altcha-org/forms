import { requestHandler } from '$lib/server/handlers';
import type { RequestHandler } from './$types';

export const GET = requestHandler(async (event) => {
	return {
		user: event.locals.user
	};
}) satisfies RequestHandler;
