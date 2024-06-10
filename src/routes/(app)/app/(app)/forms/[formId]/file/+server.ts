import { Type as t } from '@sinclair/typebox';
import { requestHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import { requestFileUpload } from '../../../../../shared.server';
import { formMiddleware } from '../shared';
import type { RequestHandler } from './$types';

export const POST = requestHandler(
	async (event, data) => {
		const { form } = await formMiddleware(event);
		if (!form) {
			throw new ForbiddenError();
		}
		return requestFileUpload(form, {
			...data,
			public: true
		});
	},
	{
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
		})
	}
) satisfies RequestHandler;
