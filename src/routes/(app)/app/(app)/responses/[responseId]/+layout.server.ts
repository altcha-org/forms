import { loadHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import { responseMiddleware } from './shared.server';
import type { LayoutServerLoad } from './$types';
import { notesService } from '$lib/server/services/notes.service';

export const load = loadHandler(async (event) => {
	const { response } = await responseMiddleware(event);
	const referrer = event.request.headers.get('referer');
	if (!response.read && referrer?.split('?')[0]?.match(/\/(inbox|dashboard)$/)) {
		await responsesService
			.flagResponses([response.id], {
				read: true
			})
			.catch(() => {});
	}
	if (event.url.pathname.endsWith('/data')) {
		await responsesService.trackAccessEvent(event, response);
	}
	return {
		account: response.form.account,
		countNotes: notesService.countNotesForResponse(response.id),
		response
	};
}) satisfies LayoutServerLoad;
