import { requestHandler } from '$lib/server/handlers';
import { rateLimit } from '$lib/server/ratelimiter';
import type { RequestHandler } from './$types';

export const OPTIONS = requestHandler(
	async (event) => {
		await rateLimit('L1', event);
		const origin = event.request.headers.get('origin');
		return new Response('', {
			headers: {
				'access-control-allow-origin': origin || '*',
				'access-control-allow-methods': 'GET',
				'access-control-max-age': '86400',
				'referrer-policy': 'origin',
				vary: origin ? 'origin' : '*'
			},
			status: 204
		});
	},
	{
		authorization: false
	}
) satisfies RequestHandler;

export const GET = requestHandler(
	async (event) => {
		await rateLimit('L1', event);
		const version = event.params.version === 'latest' ? 'main' : event.params.version;
		const resp = await fetch(
			new URL(
				`/gh/altcha-org/altcha@${version}/dist/${event.params.script}`,
				'https://cdn.jsdelivr.net'
			)
		);
		return new Response(resp.body, {
			headers: {
				'content-type': resp.headers.get('content-type') || '',
				'cache-control': resp.headers.get('cache-control') || '',
				etag: resp.headers.get('etag') || ''
			}
		});
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
