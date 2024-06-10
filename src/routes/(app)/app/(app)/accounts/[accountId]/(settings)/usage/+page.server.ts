import { accountsService } from '$lib/server/services/accounts.service';
import { getAccountUsage } from '$lib/server/redis';
import { formsService } from '$lib/server/services/forms.service';
import { loadHandler } from '$lib/server/handlers.js';
import type { PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const accountId = event.params.accountId;
		const limitUsers = await accountsService.countAccountUsersAndInvites(accountId);
		const limitApi = await getAccountUsage(accountId);
		const limitForms = await formsService.countFormsForAccount(accountId);
		return {
			usage: {
				limitApi,
				limitForms,
				limitUsers
			} as Record<string, number>
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;
