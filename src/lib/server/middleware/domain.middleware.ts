import { getAppBaseUrl } from '$lib/server/env';
import { ForbiddenError } from '$lib/server/errors';
import type { RequestEvent } from '@sveltejs/kit';

const HOSTNAME = new URL(getAppBaseUrl(), 'http://localhost').host;

export default () => {
	return (event: RequestEvent) => {
		if (HOSTNAME !== event.url.host) {
			throw new ForbiddenError('Hostname not allowed.');
		}
	};
};
