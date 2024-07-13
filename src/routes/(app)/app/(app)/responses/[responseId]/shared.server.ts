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
	checkUserAccountAccess(event.locals.user, response.form.accountId);
	const role = event.locals.user.accountsToUsers.find(
		({ account }) => account.id === response.form.accountId
	)?.role;
	if (
		response.form.restricted &&
		role !== 'admin' &&
		!response.form.formsToUsers.some(({ userId }) => userId === event.locals.user?.id)
	) {
		throw new ForbiddenError();
	}
	return {
		response
	};
}
