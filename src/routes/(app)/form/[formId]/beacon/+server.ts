import { Type as t } from '@sinclair/typebox';
import { LRUCache } from 'lru-cache';
import { normalizeFormId, timeZoneToCountryCode } from '$lib/helpers';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import { sessionsService } from '$lib/server/services/sessions.service';
import type { RequestHandler } from './$types';

const formLruCache = new LRUCache<string, boolean>({
	max: 2000,
	ttl: 1000 * 60 * 10
});

export const POST: RequestHandler = requestHandler(
	async ({ params, url }, data) => {
		const tz = url.searchParams.get('tz');
		const mobile = url.searchParams.get('mobile') === '1';
		const formId = normalizeFormId(params.formId);
		await checkForm(formId);
		await sessionsService.createSession({
			abondoned: data.submit ? false : true,
			country: (tz && timeZoneToCountryCode(tz)) || null,
			mobile,
			fieldDropOff: data.submit ? null : data.fields[data.fields.length - 1]?.[0],
			error: data.error || null,
			fields: data.fields.length ? data.fields : null,
			formId,
			responseId: null,
			startAt: new Date(data.start || Date.now()),
			submitAt: data.submit ? new Date(data.submit) : null
		});
	},
	{
		authorization: false,
		body: t.Object({
			error: t.Optional(t.Boolean()),
			fields: t.Array(
				t.Tuple([
					t.String({
						maxLength: 120
					}),
					t.Integer(),
					t.Integer(),
					t.Integer()
				]),
				{
					maxItems: 200
				}
			),
			start: t.Integer({
				minimum: 0
			}),
			submit: t.Integer({
				minimum: 0
			})
		}),
		jsonBody: true,
		rateLimit: 'L3'
	}
) satisfies RequestHandler;

async function checkForm(formId: string) {
	const cached = formLruCache.get(formId);
	if (cached !== void 0) {
		if (cached === false) {
			throw new ForbiddenError();
		}
		return cached;
	}
	const form = await formsService.findForm(formId);
	if (!form || form.account.plan?.featureAnalytics !== true) {
		formLruCache.set(formId, false);
		throw new ForbiddenError();
	}
	formLruCache.set(formId, true);
	return true;
}
