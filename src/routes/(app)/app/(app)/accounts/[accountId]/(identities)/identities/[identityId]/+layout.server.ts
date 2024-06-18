import { loadHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import { identityMiddleware } from '../../shared';
import type { LayoutServerLoad } from './$types';

export const load = loadHandler(async (event) => {
	const { account } = await event.parent();
  const { identity } = await identityMiddleware(event);
  const totalResponses = await responsesService.countResponsesForIdentity(identity.id);
	return {
    account,
    identity,
    totalResponses,
	};
}) satisfies LayoutServerLoad;
