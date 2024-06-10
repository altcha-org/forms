import { formMiddleware } from '../shared';
import { Type as t } from '@sinclair/typebox';
import { responsesService } from '$lib/server/services/responses.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ params, url }) => {
	const filterParam = url.searchParams.get('filter');
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const filter = (
		['starred', 'unread', 'spam'].includes(filterParam || '') ? filterParam! : void 0
	) as 'spam' | 'starred' | 'unread' | undefined;
	const limit = 30;
	const countPromise = responsesService.countResponses(params.formId);
	return {
		count: countPromise.catch(() => {
			return {
				recent: 0,
				spam: 0,
				starred: 0,
				total: 0,
				unread: 0
			};
		}),
		filter,
		pagination: {
			offset,
			limit,
			total: countPromise.then((result) => (filter ? result[filter] : result.recent))
		},
		responses: await responsesService.listResponses({
			formId: params.formId,
			filter,
			limit,
			offset
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	bulkDelete: actionHandler(
		async (event, data) => {
			await formMiddleware(event);
			if (typeof data.responses === 'string') {
				data.responses = data.responses.split(',');
			}
			await responsesService.deleteResponses(data.responses);
		},
		{
			body: t.Object({
				responses: t.Union([
					t.String({
						maxLength: 2600
					}),
					t.Array(t.String(), {
						maxItems: 100
					})
				])
			})
		}
	),

	bulkMarkAsRead: actionHandler(
		async (event, data) => {
			await formMiddleware(event);
			if (typeof data.responses === 'string') {
				data.responses = data.responses.split(',');
			}
			await responsesService.flagResponses(data.responses, {
				read: true
			});
		},
		{
			body: t.Object({
				responses: t.Union([
					t.String({
						maxLength: 2600
					}),
					t.Array(t.String(), {
						maxItems: 100
					})
				])
			})
		}
	),

	bulkMarkAsSpam: actionHandler(
		async (event, data) => {
			await formMiddleware(event);
			if (typeof data.responses === 'string') {
				data.responses = data.responses.split(',');
			}
			await responsesService.flagResponses(data.responses, {
				spam: true
			});
		},
		{
			body: t.Object({
				responses: t.Union([
					t.String({
						maxLength: 2600
					}),
					t.Array(t.String(), {
						maxItems: 100
					})
				])
			})
		}
	),

	flagResponse: actionHandler(
		async (event, data) => {
			await formMiddleware(event);
			await responsesService.flagResponses([data.responseId], {
				flag: data.flag
			});
		},
		{
			body: t.Object({
				flag: t.Optional(t.Boolean()),
				responseId: t.String({
					minLength: 8
				})
			})
		}
	)
} satisfies Actions;
