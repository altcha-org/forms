import { Type as t } from '@sinclair/typebox';
import { formsService } from '$lib/server/services/forms.service';
import { requestHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import { normalizeFormId } from '$lib/helpers';
import { createHmacKey, protectedEndpoint } from '$lib/server/altcha';
import { requestFileUpload } from '../../../shared.server';
import type { RequestHandler } from './$types';

export const POST = requestHandler(
	async (event, data) => {
		const formId = normalizeFormId(event.params.formId);
		await protectedEndpoint(event, createHmacKey(formId));
		const form = await formsService.findForm(formId);
		if (!form) {
			throw new ForbiddenError();
		}
		return requestFileUpload(form, data);
	},
	{
		authorization: false,
		body: t.Object({
			name: t.String({
				minLength: 1
			}),
			size: t.Integer({
				minimum: 1
			}),
			type: t.String({
				minLength: 1
			})
		}),
		rateLimit: 'L3'
	}
) satisfies RequestHandler;
