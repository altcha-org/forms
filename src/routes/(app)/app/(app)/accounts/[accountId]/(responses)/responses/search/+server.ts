import { Type as t } from '@sinclair/typebox';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { apiParamsSchema } from '$lib/server/schemas/index';
import { formsService } from '$lib/server/services/forms.service';
import { responsesService } from '$lib/server/services/responses.service';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event, _, searchParams) => {
		const { account, user } = event.locals;
		if (!account) {
			throw new ForbiddenError();
		}
		const { orderBy, orderDir, offset, includeForms, limit } = searchParams;
		const forms = includeForms ? await formsService.listFormsForUser(account.id, user.id) : [];
		const responseCount = includeForms ? await formsService.countResponsesForForms(account.id) : [];
		const total = await responsesService.countResponsesForAccount(account.id);
		const responses = await responsesService.listResponsesForAccountAndUser({
			accountId: account.id,
			limit,
			offset,
			orderBy,
			orderDir,
			userId: user.id,
		});
		return {
			forms,
			responseCount,
			responses: {
				offset,
				limit,
				results: responses,
				total,
			},
		};
	},
	{
		rateLimit: 'L1',
		searchParams: t.Composite([
			apiParamsSchema,
			t.Object({
				includeForms: t.Boolean({
					default: true,
				}),
			}),
		]),
	}
) satisfies RequestHandler;
