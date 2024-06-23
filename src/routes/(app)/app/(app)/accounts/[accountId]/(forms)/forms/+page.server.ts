import { redirect } from '@sveltejs/kit';
import { Type as t } from '@sinclair/typebox';
import { env } from '$lib/server/env';
import { formsService } from '$lib/server/services/forms.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';
import type { IFormProcessor } from '$lib/types';

export const load = loadHandler(async ({ locals, params }) => {
	const { user } = locals;
	return {
		accountRole: user.accountsToUsers.find(({ account }) => account.id === params.accountId)?.role,
		count: formsService.countResponsesForForms(params.accountId),
		forms: await formsService.listFormsForUser({
			accountId: params.accountId,
			userId: user.id,
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	createForm: actionHandler(
		async (event, data) => {
			const limit = event.locals.account?.plan?.limitForms || 0;
			const formsCount = await formsService.countFormsForAccount(event.params.accountId);
			if (formsCount >= limit) {
				throw new ForbiddenError();
			}
			const template = formsService.getTemplate(data.template);
			if (!template) {
				throw new ForbiddenError();
			}
			const processors: IFormProcessor[] = [
				{
					config: {},
					enabled: true,
					type: 'store'
				}
			];
			if (env.SPAM_FILTER_URL) {
				processors.push({
					config: {},
					enabled: true,
					type: 'spamfilter'
				});
			}
			const form = await formsService.createForm({
				accountId: event.params.accountId,
				locale: event.locals.user.locale,
				name: data.name,
				steps: template.steps || [],
				processors
			});
			throw redirect(303, `/app/forms/${form.id}/inbox`);
		},
		{
			body: t.Object({
				name: t.String({
					minLength: 1
				}),
				template: t.String({
					minLength: 1
				})
			})
		}
	)
} satisfies Actions;
