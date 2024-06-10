import { redirect } from '@sveltejs/kit';
import { formsService } from '$lib/server/services/forms.service';
import { ForbiddenError } from '$lib/server/errors';
import { normalizeFormId } from '$lib/helpers';
import { requestHandler } from '$lib/server/handlers';
import type { TResponseData } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event) => {
		throw redirect(303, `/form/${event.params.formId}`);
	},
	{
		authorization: false
	}
) satisfies RequestHandler;

export const POST = requestHandler(
	async (event) => {
		const formId = normalizeFormId(event.params.formId);
		const form = await formsService.findForm(normalizeFormId(event.params.formId));
		if (!form) {
			throw new ForbiddenError();
		}
		if (form.status !== 'published') {
			throw new ForbiddenError();
		}
		const params = new URLSearchParams({
			referrer: event.request.headers.get('referer') || ''
		});
		let formData: TResponseData = {};
		try {
			formData = formsService.validate(
				form,
				Object.fromEntries((await event.request.formData()).entries()) as TResponseData
			);
			params.set('data', JSON.stringify(formData));
		} catch (err) {
			params.set('error', JSON.stringify(err));
		}
		return event.fetch(`/form/${formId}/submit_page?${params.toString()}`);
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
