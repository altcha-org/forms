import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { identitiesService } from '$lib/server/services/identities.service';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ parent }) => {
	const { account } = await parent();
	const totalIdentitiesPromise = identitiesService.countIdentitiesForAccount(account.id);
	return {
		totalIdentitiesPromise
	};
}) satisfies PageServerLoad;

export const actions = {
	search: actionHandler(
		async (event, data) => {
			const { account } = event.locals;
			if (!account) {
				throw new ForbiddenError();
			}
			const identity = await identitiesService.searchIdentity({
				accountId: account.id,
				query: data.query
			});
			return {
				identities: identity ? [identity] : []
			};
		},
		{
			body: t.Object({
				query: t.String({
					maxLength: 256,
					minLength: 1
				})
			})
		}
	)
} satisfies Actions;
