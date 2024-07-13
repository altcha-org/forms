import { parseISO } from 'date-fns';
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
		const { dateEnd, dateStart, formId, orderBy, orderDir, offset, limit } = searchParams;
		const responseIds = searchParams.responseIds?.split(',').filter((p) => !!p);
		const total = responseIds?.length
			? responseIds.length
			: formId
				? await responsesService.countResponsesForForm({
						dateEnd: dateEnd ? parseISO(dateEnd) : void 0,
						dateStart: dateStart ? parseISO(dateStart) : void 0,
						formId
					})
				: await responsesService.countResponsesForAccountUser({
						accountId: account.id,
						dateEnd: dateEnd ? parseISO(dateEnd) : void 0,
						dateStart: dateStart ? parseISO(dateStart) : void 0,
						userId: user.id
					});
		const responses = await responsesService.listResponsesForAccountAndUser({
			accountId: account.id,
			dateEnd: dateEnd ? new Date(dateEnd) : void 0,
			dateStart: dateStart ? new Date(dateStart) : void 0,
			formId: searchParams.formId,
			limit,
			offset,
			orderBy,
			orderDir,
			responseIds,
			userId: user.id
		});
		return {
			offset,
			limit,
			responses,
			total
		};
	},
	{
		rateLimit: 'L1',
		searchParams: t.Object({
			dateEnd: t.Optional(
				t.String({
					format: 'date-time'
				})
			),
			dateStart: t.Optional(
				t.String({
					format: 'date-time'
				})
			),
			formId: t.Optional(t.String()),
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
			}),
			responseIds: t.Optional(t.String())
		})
	}
) satisfies RequestHandler;
