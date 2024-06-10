import { ForbiddenError } from '$lib/server/errors';
import { apiKeysService } from '$lib/server/services/apiKeys.service';
import type { RequestEvent } from '@sveltejs/kit';

export default () => {
	return async (event: RequestEvent) => {
		const authorization = event.request.headers.get('authorization');
		if (authorization) {
			const [kind, token] = authorization.split(' ', 2);
			if (kind.toLowerCase() === 'bearer') {
				const apiKey = await apiKeysService.findApiKey(token);
				if (!apiKey || apiKey.deleted || apiKey.features.includes('forms_api')) {
					throw new ForbiddenError();
				}
				event.locals.apiKey = apiKey;
			}
		}
	};
};
