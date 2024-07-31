import { requestHandler } from '$lib/server/handlers';
import { formHandler } from '$lib/server/handlers/form.handler';
import type { RequestHandler } from './$types';

export const POST = requestHandler(
	async (event) => {
		return formHandler(event);
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
