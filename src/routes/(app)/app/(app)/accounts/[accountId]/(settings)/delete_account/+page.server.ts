import { redirect } from '@sveltejs/kit';
import { actionHandler } from '$lib/server/handlers';
import { accountsService } from '$lib/server/services/accounts.service';
import type { Actions } from './$types';

export const actions = {
	deleteProfile: actionHandler(
		async (event) => {
			await accountsService.deleteAccount(event.params.accountId);
			throw redirect(303, '/app/accounts');
		},
		{
			requiredRole: 'admin'
		}
	)
} satisfies Actions;
