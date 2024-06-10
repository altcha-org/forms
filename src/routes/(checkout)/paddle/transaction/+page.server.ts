import { env } from '$lib/server/env.js';
import { ForbiddenError } from '$lib/server/errors.js';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ url }) => {
	const transactionId = url.searchParams.get('_ptxn');
	if (!transactionId) {
		throw new ForbiddenError();
	}
	return {
		transactionId,
		paddleClientToken: env.PADDLE_CLIENT_TOKEN!,
		paddleEnv: env.PADDLE_ENV
	};
}) satisfies PageServerLoad;

export const actions = {
	confirm: actionHandler(async () => {
		// TODO: paddle change plan
	})
} satisfies Actions;
