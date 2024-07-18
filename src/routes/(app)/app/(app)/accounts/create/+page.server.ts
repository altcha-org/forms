import { Type as t } from '@sinclair/typebox';
import { env } from '$lib/server/env.js';
import { actionHandler } from '$lib/server/handlers';
import { redirect, type Actions } from '@sveltejs/kit';
import { accountsService } from '$lib/server/services/accounts.service';
import { plansService } from '$lib/server/services/plans.service';
import { ForbiddenError } from '$lib/server/errors';

export const actions = {
	default: actionHandler(
		async (event, data) => {
			if (!event.locals.user) {
				throw new ForbiddenError();
			}
			const freeAccounts = event.locals.user.accountsToUsers.filter(
				({ account }) => account.plan?.premium !== true
			).length;
			const maxFreeAccounts = parseInt(env.LIMIT_FREE_ACCOUNTS_PER_USER, 10) || 0;
			if (maxFreeAccounts > 0 && freeAccounts >= maxFreeAccounts) {
				throw new ForbiddenError();
			}
			const plan = await plansService.getDefaultPlan();
			const account = await accountsService.createAccount({
				name: data.name,
				planId: plan?.id,
				timeZone: data.tz
			});
			await accountsService.createAccountUser({
				accountId: account.id,
				role: 'admin',
				userId: event.locals.user!.id
			});
			throw redirect(303, '/app/accounts');
		},
		{
			body: t.Object({
				name: t.String(),
				tz: t.String()
			})
		}
	)
} satisfies Actions;
