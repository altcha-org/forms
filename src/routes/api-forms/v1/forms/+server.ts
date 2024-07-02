import { Type as t } from '@sinclair/typebox';
import { requestHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import { formSchema } from '$lib/server/schemas/index';
import { ForbiddenError } from '$lib/server/errors';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event, _, searchParams) => {
		const accountId = event.locals.apiKey.account.id;
		const { orderBy, orderDir, offset, limit } = searchParams;
		const [data, total] = await Promise.all([
			formsService.listFormsForApi({
				accountId,
				orderBy,
				orderDir,
				offset,
				limit
			}),
			formsService.countFormsForAccount(accountId)
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
				default: 'asc'
			}),
			orderBy: t.Union([t.Literal('id'), t.Literal('name')], {
				default: 'id'
			})
		})
	}
) satisfies RequestHandler;

export const POST = requestHandler(
	async (event, data) => {
		const apiKey = event.locals.apiKey;
		const limit = apiKey.account?.plan?.limitForms;
		const formsCount = await formsService.countFormsForAccount(apiKey.account.id);
		if (limit && formsCount >= limit) {
			throw new ForbiddenError('Limit reached.');
		}
		const form = await formsService.createForm({
			accountId: apiKey.account.id,
			locale: data.locale,
			name: data.name,
			processors: data.processors || [],
			steps: data.steps || []
		});
		return {
			data: form
		};
	},
	{
		authorization: 'apiKey',
		body: t.Composite([
			formSchema,
			t.Object({
				name: t.String()
			})
		]),
		rateLimit: 'L3'
	}
) satisfies RequestHandler;
