import { formMiddleware } from '../shared';
import { formsService } from '$lib/server/services/forms.service';
import { actionHandler } from '$lib/server/handlers';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { checkUserAccountAccess } from '$lib/server/helpers';

export const actions = {
	deleteForm: actionHandler(async (event) => {
		const { user } = event.locals;
		const { form } = await formMiddleware(event);
		checkUserAccountAccess(user, form.accountId, 'admin');
		await formsService.deleteForm(form.id);
		await formsService.trackDeleteEvent(event, form);
		throw redirect(303, `/app/accounts/${form.accountId}/forms`);
	})
} satisfies Actions;
