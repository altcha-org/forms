import { ForbiddenError } from '$lib/server/errors';
import { apiKeysService } from '$lib/server/services/apiKeys.service';
import type { RequestEvent } from '@sveltejs/kit';

export default () => {
	return async (event: RequestEvent) => {
		const authorization = event.request.headers.get('authorization');
		const referrer = event.request.headers.get('referer');
		let token: string | null = event.url.searchParams.get('apiKey');
		if (authorization) {
			const [kind, str] = authorization.split(' ', 2);
			if (kind.toLowerCase() === 'bearer') {
				token = str;
			}
		}
		if (token) {
			const apiKey = await apiKeysService.findApiKey(token);
			if (!apiKey || apiKey.deleted) {
				throw new ForbiddenError();
			}
			if (apiKey.referrer?.length) {
				if (!referrer) {
					throw new ForbiddenError('Wrong referrer.');
				}
				const host = new URL(referrer, 'http://unknowndomain').host;
				const referrers = apiKey.referrer?.split(/[\n;,]/).map((p: string) => p.trim()).filter((p: string) => !!p);
				if (!referrers.includes(host)) {
					throw new ForbiddenError('Wrong referrer.');
				}
				event.locals.apiKeyReferrer = host;
			}
			event.locals.apiKey = apiKey;
		}
	};
};
