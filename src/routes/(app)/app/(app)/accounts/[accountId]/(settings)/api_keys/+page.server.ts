import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { apiKeysService } from '$lib/server/services/apiKeys.service';
import { checkUserAccountAccess } from '$lib/server/helpers';
import { EComplexity } from '$lib/types';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const { account } = event.locals;
		const accountId = event.params.accountId;
		const limitApiKeys = account?.plan?.limitApiKeys || 0;
		const apiKeys = await apiKeysService.listApiKeysForAccount(accountId);
		return {
			apiKeys,
			canAddApiKey: apiKeys.filter(({ deleted }) => !deleted).length < limitApiKeys
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;

export const actions = {
	createApiKey: actionHandler(
		async (event, data) => {
			checkUserAccountAccess(event.locals.user!, event.params.accountId, 'admin');
			const limitApiKeys = event.locals.account?.plan?.limitApiKeys || 0;
			const activeApiKeys = await apiKeysService.countActiveApiKeysForAccount(
				event.params.accountId
			);
			if (activeApiKeys > limitApiKeys) {
				throw new ForbiddenError();
			}
			const features = data.features.split(',').filter((f) => !!f);
			await apiKeysService.createApiKey({
				accountId: event.params.accountId,
				features,
				name: data.name,
				referrer: data.referrer,
				secret: data.secret
			});
		},
		{
			body: t.Object({
				features: t.String(),
				name: t.String({
					minLength: 1
				}),
				referrer: t.String(),
				secret: t.String({
					maxLength: 64,
					minLength: 24
				})
			})
		}
	),

	deleteApiKey: actionHandler(
		async (event, data) => {
			checkUserAccountAccess(event.locals.user!, event.params.accountId, 'admin');
			await apiKeysService.deleteApiKey(data.apiKeyId);
		},
		{
			body: t.Object({
				apiKeyId: t.String()
			})
		}
	),

	invalidateApiKey: actionHandler(
		async (event, data) => {
			checkUserAccountAccess(event.locals.user!, event.params.accountId, 'admin');
			await apiKeysService.invalidateApiKey(data.apiKeyId);
		},
		{
			body: t.Object({
				apiKeyId: t.String()
			})
		}
	),

	updateApiKey: actionHandler(
		async (event, data) => {
			checkUserAccountAccess(event.locals.user!, event.params.accountId, 'admin');
			const features = data.features?.split(',').filter((f) => !!f);
			await apiKeysService.updateApiKey(data.apiKeyId, {
				features,
				name: data.name,
				referrer: data.referrer,
				secret: data.secret
			});
		},
		{
			body: t.Object({
				apiKeyId: t.String(),
				complexity: t.Optional(t.Enum(EComplexity)),
				features: t.Optional(t.String()),
				name: t.Optional(
					t.String({
						minLength: 1
					})
				),
				secret: t.Optional(
					t.String({
						maxLength: 64,
						minLength: 24
					})
				),
				referrer: t.Optional(t.String())
			})
		}
	)
} satisfies Actions;
