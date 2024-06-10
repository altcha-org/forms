import { formMiddleware } from '../shared';
import { Type as t } from '@sinclair/typebox';
import { formsService } from '$lib/server/services/forms.service';
import { actionHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions } from './$types';

export const actions = {
	upsertProcessors: actionHandler(
		async (event, data) => {
			const { account, form } = await formMiddleware(event);
			if (account.plan?.featureProcessors !== true) {
				throw new ForbiddenError();
			}
			const processors = JSON.parse(data.processors);
			await formsService.updateForm(form.id, {
				processors
			});
			await formsService.trackUpdateEvent(event, form, {
				processors
			});
		},
		{
			body: t.Object({
				processors: t.String()
			})
		}
	)
} satisfies Actions;
