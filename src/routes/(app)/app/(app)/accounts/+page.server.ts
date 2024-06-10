import { Type as t } from '@sinclair/typebox';
import { invitesService } from '$lib/server/services/invites.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { env } from '$lib/server/env';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ locals }) => {
	const { user } = locals;
	return {
		freeAccounts: user.accountsToUsers.filter(({ account }) => account.plan?.premium !== true)
			.length,
		maxFreeAccounts: parseInt(env.LIMIT_FREE_ACCOUNTS_PER_USER, 10) || 0,
		invites: user.email ? await invitesService.listInvitesForEmail(user.email) : []
	};
}) satisfies PageServerLoad;

export const actions = {
	acceptInvite: actionHandler(
		async ({ locals }, data) => {
			const { user } = locals;
			await invitesService.acceptInvite(user, data.inviteId);
		},
		{
			body: t.Object({
				inviteId: t.String()
			})
		}
	),

	declineInvite: actionHandler(
		async ({ locals }, data) => {
			const { user } = locals;
			await invitesService.declineInvite(user, data.inviteId);
		},
		{
			body: t.Object({
				inviteId: t.String()
			})
		}
	)
} satisfies Actions;
