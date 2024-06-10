import { normalizeFormId } from '$lib/helpers';
import { createHmacKey, createChallenge } from '$lib/server/altcha';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import { EComplexity } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = requestHandler(
	async ({ params }) => {
		const formId = normalizeFormId(params.formId);
		const form = await formsService.findForm(formId);
		if (!form) {
			throw new ForbiddenError();
		}
		const { challenge, expire } = await createChallenge({
			// TODO: get form complexity
			complexity: EComplexity.MEDIUM,
			hmacKey: createHmacKey(formId)
		});
		return new Response(JSON.stringify(challenge), {
			headers: {
				'content-type': 'application/json',
				expires: new Date(expire).toISOString()
			}
		});
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
