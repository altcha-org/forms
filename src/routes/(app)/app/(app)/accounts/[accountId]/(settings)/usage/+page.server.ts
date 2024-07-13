import { Type as t } from '@sinclair/typebox';
import { accountsService } from '$lib/server/services/accounts.service';
import { getAccountUsage, getApiKeyUsage } from '$lib/server/redis';
import { formsService } from '$lib/server/services/forms.service';
import { apiKeysService } from '$lib/server/services/apiKeys.service';
import { actionHandler, loadHandler } from '$lib/server/handlers.js';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const month = event.url.searchParams.get('month') || void 0;
		const accountId = event.params.accountId;
		const limitUsers = await accountsService.countAccountUsersAndInvites(accountId);
		const usage = await getAccountUsage(accountId, month);
		const limitForms = await formsService.countFormsForAccount(accountId);
		const apiKeys = await apiKeysService.listApiKeysForAccount(accountId);
		return {
			apiKeys,
			days: usage?.days || [],
			usage: {
				limitApi: usage?.sum || 0,
				limitForms,
				limitUsers
			} as Record<string, number>
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;

export const actions = {
	loadApiKeyUsage: actionHandler(
		async (event, data) => {
			const apiKey = await apiKeysService.findApiKey(data.apiKeyId);
			if (!apiKey || !event.locals.account || apiKey.account.id !== event.locals.account.id) {
				throw new ForbiddenError();
			}
			return getApiKeyUsage(data.apiKeyId, data.month);
		},
		{
			requiredRole: 'admin',
			body: t.Object({
				apiKeyId: t.String(),
				month: t.Optional(t.String())
			})
		}
	)
} satisfies Actions;
