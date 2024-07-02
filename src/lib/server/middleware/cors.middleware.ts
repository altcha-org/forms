import type { RequestEvent } from "@sveltejs/kit";

export default () => {
	return async (event: RequestEvent) => {
		if (event.request.method === 'OPTIONS') {
			const origin = event.request.headers.get('origin');
			return new Response(null, {
				headers: {
					'access-control-allow-origin': origin || '*',
					'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE',
					'access-control-max-age': '86400',
					'referrer-policy': 'origin',
					vary: origin ? 'origin' : '*'
				},
				status: 204
			});
		}
	};
};