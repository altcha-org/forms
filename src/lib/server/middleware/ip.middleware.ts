import type { RequestEvent } from '@sveltejs/kit';

export default () => {
	return (event: RequestEvent) => {
		event.locals.remoteAddress = event.getClientAddress();

		const forwardedFor = event.request.headers.get('x-forwarded-for');
		if (forwardedFor?.length) {
			const [addr] = forwardedFor.split(',');
			if (addr) {
				event.locals.remoteAddress = addr.trim();
			}
		}
	};
};
