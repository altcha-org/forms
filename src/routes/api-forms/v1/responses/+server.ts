import { requestHandler } from '$lib/server/handlers';
import { apiParamsSchema } from '$lib/server/schemas/index';
import { responsesService } from '$lib/server/services/responses.service';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event, _, searchParams) => {
		const accountId = event.locals.apiKey.account.id;
		const { orderBy, orderDir, offset, limit } = searchParams;
		const [data, total] = await Promise.all([
			responsesService.listResponsesForAccount({
				accountId,
				orderBy,
				orderDir,
				offset,
				limit
			}),
			responsesService.countResponsesForAccount(accountId)
		]);
		return {
			data,
			offset,
			limit,
			total
		};
	},
	{
		apiKeyFeatures: ['forms_api'],
		authorization: 'apiKey',
		rateLimit: 'L1',
		searchParams: apiParamsSchema
	}
) satisfies RequestHandler;
