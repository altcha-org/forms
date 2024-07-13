import { loadHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import { formsService } from '$lib/server/services/forms.service';
import type { PageServerLoad } from './$types';

export const load = loadHandler(async ({ locals, parent, url }) => {
	const { identity } = await parent();
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const limit = 100;
	const responses = await responsesService.listResponsesForIdentity({
		identityId: identity.id,
		limit,
		offset
	});
	return {
		forms: await formsService.listFormsForUser({
			accountId: identity.accountId,
			userId: locals.user.id
		}),
		limit,
		offset,
		responses
	};
}) satisfies PageServerLoad;
