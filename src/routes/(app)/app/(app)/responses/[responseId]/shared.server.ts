import { ForbiddenError } from '$lib/server/errors';
import { responsesService } from '$lib/server/services/responses.service';
import { checkUserAccountAccess } from '$lib/server/helpers';
import type { RequestEvent } from '@sveltejs/kit';

export async function responseMiddleware(event: RequestEvent<{ responseId: string }>) {
	if (!event.locals.user) {
		throw new ForbiddenError();
	}
	const response = await responsesService.findResponse(event.params.responseId);
	if (!response) {
		throw new ForbiddenError();
	}
	checkUserAccountAccess(event.locals.user, response.form.account.id);
	return {
		response
	};
}
