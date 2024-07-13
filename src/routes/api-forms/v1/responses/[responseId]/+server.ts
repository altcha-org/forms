import { EIdPrefix, idgen } from '$lib/server/id';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import type { RequestHandler, RequestEvent } from './$types';

export const GET = requestHandler(
	async (event) => {
		const { response } = await middleware(event);
		return {
			data: response
		};
	},
	{
		apiKeyFeatures: ['forms_api'],
		authorization: 'apiKey',
		rateLimit: 'L1'
	}
) satisfies RequestHandler;

export const DELETE = requestHandler(
	async (event) => {
		const { response } = await middleware(event);
		await responsesService.deleteResponses([response.id]);
	},
	{
		apiKeyFeatures: ['forms_api'],
		authorization: 'apiKey',
		rateLimit: 'L3'
	}
) satisfies RequestHandler;

async function middleware(event: RequestEvent) {
	const apiKey = event.locals.apiKey!;
	const responseId = event.params.responseId;
	if (!idgen.isValid(responseId, EIdPrefix.RESPONSE)) {
		throw new ForbiddenError('Invalid response ID.');
	}
	const response = await responsesService.findResponse(responseId);
	if (!response || response?.accountId !== apiKey.account.id) {
		throw new ForbiddenError('Response not found.');
	}
	return {
		response
	};
}
