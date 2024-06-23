import { Type as t } from '@sinclair/typebox';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event, _, searchParams) => {
		const { account, user } = event.locals;
		if (!account) {
			throw new ForbiddenError();
		}
		const { orderBy, orderDir, offset, limit } = searchParams;
		const total = await responsesService.countResponsesForAccountUser(account.id, user.id);
		const responses = await responsesService.listResponsesForAccountAndUser({
			accountId: account.id,
			limit,
			offset,
			orderBy,
			orderDir,
			userId: user.id,
		});
		return {
			offset,
			limit,
			responses,
			total,
		};
	},
	{
		rateLimit: 'L1',
		searchParams: t.Object({
			limit: t.Integer({
				default: 30,
				maximum: 100,
				minimum: 1
			}),
			offset: t.Integer({
				default: 0,
				minimum: 0
			}),
			orderDir: t.Union([t.Literal('asc'), t.Literal('desc')], {
				default: 'desc'
			}),
			orderBy: t.String({
				default: 'id'
			})
		}),
	}
) satisfies RequestHandler;
