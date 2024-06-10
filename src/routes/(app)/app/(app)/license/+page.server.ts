import { env } from '$lib/server/env';
import { ForbiddenError } from '$lib/server/errors';
import { loadHandler } from '$lib/server/handlers';
import { license } from '$lib/server/license';
import type { PageServerLoad } from './$types';

export const load = loadHandler(() => {
	if (env.LICENSE_HIDE === '1') {
		throw new ForbiddenError();
	}
	return {
		license: license.data,
		valid: license.valid
	};
}) satisfies PageServerLoad;
