import { ForbiddenError } from '$lib/server/errors';
import { formsService } from '$lib/server/services/forms.service';
import { checkUserAccountAccess } from '$lib/server/helpers';
import type { RequestEvent } from '@sveltejs/kit';
import { accountsService } from '$lib/server/services/accounts.service';

export interface IFormMiddlewareOptions {
	requiredRole?: 'admin';
}

export async function formMiddleware(
	event: RequestEvent<{ formId: string }>,
	options: IFormMiddlewareOptions = {}
) {
	if (!event.locals.user) {
		throw new ForbiddenError();
	}
	const form = await formsService.findForm(event.params.formId);
	if (!form) {
		throw new ForbiddenError();
	}
	const role = event.locals.user.accountsToUsers.find(
		({ account }) => account.id === form.accountId
	)?.role;
	if (form.restricted && role !== 'admin') {
		if (!form.formsToUsers.some(({ userId }) => userId === event.locals.user?.id)) {
			throw new ForbiddenError();
		}
	}
	const account = await accountsService.findAccount(form.accountId);
	if (!account) {
		throw new ForbiddenError();
	}
	checkUserAccountAccess(event.locals.user, form.accountId, options.requiredRole);
	form.steps.forEach((step) => {
		step.blocks.forEach((block) => {
			if (!block.options) {
				block.options = {};
			}
		});
	});
	return {
		account,
		form
	};
}
