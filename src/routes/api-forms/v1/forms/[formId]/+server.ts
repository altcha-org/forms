import { EIdPrefix, idgen } from '$lib/server/id';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import formSchema from '$lib/server/schemas/form.schema';
import type { RequestHandler, RequestEvent } from './$types';

export const GET = requestHandler(
	async (event) => {
		const { form } = await middleware(event);
		return {
			data: form
		};
	},
	{
		authorization: 'apiKey',
		rateLimit: 'L1'
	}
) satisfies RequestHandler;

export const DELETE = requestHandler(
	async (event) => {
		const { form } = await middleware(event);
		await formsService.deleteForm(form.id);
	},
	{
		apiKeyFeatures: ['forms_api'],
		authorization: 'apiKey',
		rateLimit: 'L3'
	}
) satisfies RequestHandler;

export const PATCH = requestHandler(
	async (event, data) => {
		const { form } = await middleware(event);
		await formsService.updateForm(form.id, {
			name: data.name,
			processors: data.processors,
			steps: data.steps
		});
		return {
			data: form
		};
	},
	{
		authorization: 'apiKey',
		body: formSchema,
		rateLimit: 'L3'
	}
) satisfies RequestHandler;

async function middleware(event: RequestEvent) {
	const apiKey = event.locals.apiKey!;
	const formId = event.params.formId;
	if (!idgen.isValid(formId, EIdPrefix.FORM)) {
		throw new ForbiddenError('Invalid form ID.');
	}
	const form = await formsService.findFormForApi(formId);
	if (!form || form?.accountId !== apiKey.account.id) {
		throw new ForbiddenError('Form not found.');
	}
	return {
		form
	};
}
