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
import corsMiddleware from '$lib/server/middleware/cors.middleware';
import deviceMiddleware from '$lib/server/middleware/device.middleware';
import domainMiddleware from '$lib/server/middleware/domain.middleware';
import ipMiddleware from '$lib/server/middleware/ip.middleware';
import localeMiddleware from '$lib/server/middleware/locale.middleware';
import usageMiddleware from '$lib/server/middleware/usage.middleware';
import { BaseError, RateLimitError } from '$lib/server/errors';
import '$lib/server/jobs';
import { htmlFormHandler } from '$lib/server/handlers/htmlform.handler';

if (env.LICENSE) {
	await license.load(env.LICENSE);
}

const beforeMiddlewares: ((event: RequestEvent) => Promise<Response | void> | Response | void)[] = [
	corsMiddleware(),
	domainMiddleware(),
	ipMiddleware(),
	localeMiddleware(),
	apiKeyMiddleware(),
	authMiddleware(),
	deviceMiddleware()
];

const afterMiddlewares: ((event: RequestEvent) => Promise<Response | void> | Response | void)[] = [
	usageMiddleware()
];

let requestId: number = 0;

export const handle: Handle = async ({ event, resolve }) => {
	let startTime: DOMHighResTimeStamp | null = null;
	if (logger.level === 'trace') {
		startTime = performance.now();
		requestId = (requestId + 1) % Number.MAX_SAFE_INTEGER;
		logger.trace('(%i) request %s %s', requestId, event.request.method, event.request.url);
	}
	if (license.data?.id) {
		event.setHeaders({
			'x-license-id': license.data?.id || ''
		});
	}
	let response: Response | null | void = null;
	try {
		for (const middleware of beforeMiddlewares) {
			response = await middleware(event);
			if (response) {
				break;
			}
		}

		if (event.request.method === 'POST' && event.url.pathname.startsWith('/form/')) {
			// A workaround for custom HTML form submissions to the form's endpoint, overrides the event request
			response = await htmlFormHandler(event);
		}

		if (!response) {
			response = await resolve(event);
		}
		for (const middleware of afterMiddlewares) {
			await middleware(event);
		}
	} catch (err) {
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
		if (
			typeof err === 'object' &&
			err &&
			'status' in err &&
			typeof err.status === 'number' &&
			(!err.status || err.status >= 500)
		) {
			logger.error(err, 'Server Error %o', {
				pathname: event.url.pathname,
				routeId: event.route.id,
				status: err.status
			});
		} else if (
			typeof err === 'object' &&
			err &&
			'statusCode' in err &&
			typeof err.statusCode === 'number' &&
			(!err.statusCode || err.statusCode >= 500)
		) {
			logger.error(err, 'Server Error %o', {
				pathname: event.url.pathname,
				routeId: event.route.id,
				status: err.statusCode
			});
		}
		if (err instanceof BaseError) {
			const headers = response ? Object.fromEntries(response.headers || {}) : {};
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
		} else if (typeof err === 'object' && err && 'status' in err) {
			throw err;
		}
		logger.error(err, 'Internal Server Error %o', {
			pathname: event.url.pathname,
			routeId: event.route.id
		});
		throw error(500, 'Internal Server Error');
	}
	if (requestId && startTime) {
		const duration = Math.floor(performance.now() - startTime);
		logger.trace('(%i) response %i, %fms', requestId, response?.status || 0, duration);
	}
	return response!;
};

export const handleError: HandleServerError = async ({ error, event }) => {
	// Svelte removes previously set headers when thrown (such as ratelimit or www-authenticate),
	// -> store the error in the locals and process in the main handler
	event.locals.error = error;
};
