import { redirect, type RequestEvent } from '@sveltejs/kit';
import { formHandler } from '$lib/server/handlers/form.handler';
import { BadRequestError, ForbiddenError } from '$lib/server/errors';
import { readFormDataFromEvent } from '$lib/server/helpers';

export async function htmlFormHandler(event: RequestEvent) {
	const match = event.url.pathname.match(/^\/form\/([^/]+)\/?$/);
	if (match && match[1]) {
		const isFetch = event.request.headers.get('sec-fetch-dest') === 'empty';
		if (isFetch) {
			let error: string | undefined = void 0;
			let success: boolean = true;
			try {
				await formHandler(event as RequestEvent<{ formId: string }>);
			} catch (err: unknown) {
				error =
					err instanceof BadRequestError || err instanceof ForbiddenError
						? String(err.message)
						: 'Unexpected server error.';
				success = false;
			}
			return new Response(
				JSON.stringify({
					error,
					success
				}),
				{
					headers: {
						'content-type': 'application/json'
					}
				}
			);
		} else {
			try {
				event.locals.formData = await readFormDataFromEvent(event);
			} catch (err: unknown) {
				const url = new URL(event.url);
				const message = err instanceof BadRequestError ? err.message : 'Unknown server error.';
				url.searchParams.set('error', message);
				throw redirect(303, url);
			}
			event.request = new Request(event.request.url, {
				headers: event.request.headers,
				method: 'GET'
			});
		}
	}
}
