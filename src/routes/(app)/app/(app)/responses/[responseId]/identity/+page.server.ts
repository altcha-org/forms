import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { notesService } from '$lib/server/services/notes.service';
import { accountsService } from '$lib/server/services/accounts.service';
import { identitiesService } from '$lib/server/services/identities.service';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';
import { responsesService } from '$lib/server/services/responses.service';

export const load = loadHandler(async ({ parent }) => {
	const { response } = await parent();
	const identity = response.identityId
		? await identitiesService.findIdentity(response.identityId)
		: null;
	if (identity && identity.accountId !== response.accountId) {
		throw new ForbiddenError();
	}
	const responses = identity
		? await responsesService.listResponsesForIdentity({
				identityId: identity.id,
				limit: 100,
				offset: 0
			})
		: [];
	return {
		identity,
		responses
	};
}) satisfies PageServerLoad;

export const actions = {
	updateNote: actionHandler(async (event, data) => {}, {
		body: t.Object({})
	})
} satisfies Actions;
