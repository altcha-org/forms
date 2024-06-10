import { formMiddleware } from '../shared';
import { Type as t } from '@sinclair/typebox';
import { formsService } from '$lib/server/services/forms.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { accountsService } from '$lib/server/services/accounts.service';
import { checkUserAccountAccess } from '$lib/server/helpers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async (event) => {
	const { user } = event.locals;
	const { form } = await formMiddleware(event);
	checkUserAccountAccess(user, form.accountId, 'admin');
	const users = await accountsService.listAccountUsers(form.accountId);
	const formUsers = await formsService.listFormUsers(form.id);
	return {
		formUsers: formUsers.map(({ user }) => user.id),
		users: users.map((user) => {
			return {
				userId: user.userId,
				name: user.user.name,
				role: user.role
			};
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	updateAccess: actionHandler(
		async (event, data) => {
			const { user } = event.locals;
			const { form } = await formMiddleware(event);
			checkUserAccountAccess(user, form.accountId, 'admin');
			if (typeof data.users === 'string') {
				data.users = data.users.split(',').filter((userId) => !!userId);
			}
			if (data.restricted) {
				await formsService.upsertFormUsers(form.id, data.users);
			} else {
				await formsService.upsertFormUsers(form.id, []);
			}
			await formsService.updateForm(form.id, {
				restricted: data.restricted
			});
		},
		{
			body: t.Object({
				restricted: t.Boolean(),
				users: t.Union([
					t.String({
						maxLength: 2600
					}),
					t.Array(t.String(), {
						maxItems: 100
					})
				])
			})
		}
	)
} satisfies Actions;
