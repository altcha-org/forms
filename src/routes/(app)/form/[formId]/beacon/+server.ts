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
	async ({ params }, data) => {
		const formId = normalizeFormId(params.formId);
		await checkForm(formId);
		await sessionsService.createSession({
			abondoned: data.submit ? false : true,
			correction: data.correction === void 0 ? 0 : Math.min(100, data.correction * 100),
			country: (data.tz && timeZoneToCountryCode(data.tz)) || null,
			mobile: data.mobile === true,
			fieldDropOff: data.dropoff || null,
			error: data.error || null,
			fields: null,
			formId,
			responseId: null,
			startAt: new Date(data.start || Date.now()),
			submitAt: data.submit ? new Date(data.submit) : null
		});
	},
	{
		authorization: false,
		body: t.Object({
			correction: t.Optional(
				t.Number({
					minimum: 0
				})
			),
			error: t.Optional(t.Boolean()),
			dropoff: t.Optional(t.String()),
			mobile: t.Optional(t.Boolean()),
			start: t.Integer({
				minimum: 0
			}),
			submit: t.Integer({
				minimum: 0
			}),
			tz: t.Optional(t.String())
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
