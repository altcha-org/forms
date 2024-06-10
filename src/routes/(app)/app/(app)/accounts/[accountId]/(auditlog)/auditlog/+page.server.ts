import { ForbiddenError } from '$lib/server/errors';
import { loadHandler } from '$lib/server/handlers';
import { auditlogService } from '$lib/server/services/auditlog.service';
import type { PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const { account } = await event.parent();
		if (!account.auditlog) {
			throw new ForbiddenError();
		}
		const offset = parseInt(event.url.searchParams.get('offset') || '0', 10);
		const limit = 30;
		const events = await auditlogService.listEvents(account.id, {
			offset,
			limit
		});
		return {
			events,
			pagination: {
				offset,
				limit,
				total: auditlogService.countEvents(account.id)
			}
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;
