import { loadHandler } from '$lib/server/handlers';
import { auditlogService } from '$lib/server/services/auditlog.service';
import type { PageServerLoad } from './$types';

export const load = loadHandler(async ({ parent, url }) => {
	const { response } = await parent();
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const limit = 30;
	const events = await auditlogService.listEvents(response.accountId, {
		limit,
		offset,
		responseId: response.id
	});
	return {
		events,
		pagination: {
			offset,
			limit,
			total: auditlogService.countEvents(response.accountId, response.id)
		}
	};
}) satisfies PageServerLoad;
