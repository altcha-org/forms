import { loadHandler } from '$lib/server/handlers';
import { identitiesService } from '$lib/server/services/identities.service';
import { ForbiddenError } from '$lib/server/errors';
import { responsesService } from '$lib/server/services/responses.service';
import type { PageServerLoad } from './$types';

export const load = loadHandler(async ({ parent }) => {
	const { response } = await parent();
	const identity = response.identityId
		? await identitiesService.findIdentity(response.identityId)
		: null;
	if (identity && identity.accountId !== response.accountId) {
		throw new ForbiddenError();
	}
	const totalResponses = identity
		? await responsesService.countResponsesForIdentity(identity.id)
		: 0;
	return {
		identity,
		totalResponses
	};
}) satisfies PageServerLoad;
