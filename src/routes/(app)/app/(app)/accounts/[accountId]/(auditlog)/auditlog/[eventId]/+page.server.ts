import { loadHandler } from '$lib/server/handlers';
import { auditlogService } from '$lib/server/services/auditlog.service';
import { ForbiddenError } from '$lib/server/errors';
import type { PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const { account } = await event.parent();
		if (!account.auditlog) {
			throw new ForbiddenError();
		}
		const eventId = event.params.eventId;
		const ev = await auditlogService.findEvent(eventId);
		if (!ev || ev.accountId !== account.id) {
			throw new ForbiddenError();
		}
		return {
			event: ev
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;
