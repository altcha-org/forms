import {
	error,
	isRedirect,
	type Handle,
	type HandleServerError,
	type RequestEvent
} from '@sveltejs/kit';
import { env } from '$lib/server/env';
import { license } from '$lib/server/license';
import { logger } from '$lib/server/logger';
import apiKeyMiddleware from '$lib/server/middleware/apiKey.middleware';
import authMiddleware from '$lib/server/middleware/auth.middleware';
import deviceMiddleware from '$lib/server/middleware/device.middleware';
import domainMiddleware from '$lib/server/middleware/domain.middleware';
import ipMiddleware from '$lib/server/middleware/ip.middleware';
import localeMiddleware from '$lib/server/middleware/locale.middleware';
import { BaseError, RateLimitError } from '$lib/server/errors';
import '$lib/server/jobs';
import usageMiddleware from '$lib/server/middleware/usage.middleware';

if (env.LICENSE) {
	await license.load(env.LICENSE);
}

const beforeMiddlewares: ((event: RequestEvent) => Promise<void> | void)[] = [
	domainMiddleware(),
	ipMiddleware(),
	localeMiddleware(),
	apiKeyMiddleware(),
	authMiddleware(),
	deviceMiddleware()
];

const afterMiddlewares: ((event: RequestEvent) => Promise<void> | void)[] = [
	usageMiddleware(),
];

export const handle: Handle = async ({ event, resolve }) => {
	if (license.data?.id) {
		event.setHeaders({
			'x-license-id': license.data?.id || ''
		});
	}
	let response: any = null;
	try {
		for (const middleware of beforeMiddlewares) {
			await middleware(event);
		}
		response = await resolve(event);
		for (const middleware of afterMiddlewares) {
			await middleware(event);
		}
	} catch (err: any) {
		event.locals.error = err;
	}
	if (event.locals.error) {
		const err = event.locals.error;
		if (isRedirect(err)) {
			throw err;
		}
		if (err instanceof RateLimitError) {
			event.setHeaders({
				'X-Rate-Limit-Limit': String(err.info.limit),
				'X-Rate-Limit-Remaining': String(err.info.remaining),
				'X-Rate-Limit-Reset': String(err.info.reset)
			});
		}
		if ((!err.status || err.status >= 500) && (!err.statusCode || err.statusCode >= 500)) {
			logger.error(err, 'Server Error %o', {
				pathname: event.url.pathname,
				routeId: event.route.id
			});
		}
		if (err instanceof BaseError) {
			const headers = response ? Object.fromEntries(response.headers) : {};
			delete headers['content-length'];
			if (event.isDataRequest) {
				throw error(err.statusCode, err.message);
			} else {
				return new Response(JSON.stringify(err.toJSON()), {
					headers: {
						...headers,
						'content-type': 'application/json'
					},
					status: err.statusCode
				});
			}
		} else if (err.status) {
			throw err;
		}
		throw error(500, 'Internal Server Error');
	}
	return response;
};

export const handleError: HandleServerError = async ({ error, event }) => {
	// Svelte removes previously set headers when thrown (such as ratelimit or www-authenticate),
	// -> store the error in the locals and process in the main handler
	event.locals.error = error;
};
