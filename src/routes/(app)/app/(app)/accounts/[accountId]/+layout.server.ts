import { loadHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';

export const load = loadHandler(async ({ locals, params }) => {
	const { account } = locals;
	if (!account) {
		throw new ForbiddenError();
	}
	return {
		account
	};
});
