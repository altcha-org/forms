import { requestHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import type { RequestHandler } from './$types';

export const GET = requestHandler((event) => {
	const locale = event.url.searchParams.get('locale') || event.locals.locale;
	return {
		templates: formsService.templates.get(locale)
	};
}) satisfies RequestHandler;
