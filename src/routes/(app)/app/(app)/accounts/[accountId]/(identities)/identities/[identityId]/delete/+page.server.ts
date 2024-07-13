import { actionHandler } from '$lib/server/handlers';
import { identitiesService } from '$lib/server/services/identities.service';
import { redirect } from '@sveltejs/kit';
import { identityMiddleware } from '../../../shared';
import type { Actions } from './$types';

export const actions = {
	deleteIdentity: actionHandler(async (event) => {
		const { identity } = await identityMiddleware(event);
		await identitiesService.deleteIdentity(identity.id);
		await identitiesService.trackDeleteEvent(event, identity);
		throw redirect(303, `/app/accounts/${identity.accountId}/identities?deleted=1`);
	})
} satisfies Actions;
