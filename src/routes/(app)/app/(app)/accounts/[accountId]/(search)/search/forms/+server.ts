import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import { apiParamsSchema } from '$lib/server/schemas';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event, _, searchParams) => {
		const { account, user } = event.locals;
		if (!account) {
			throw new ForbiddenError();
		}
    const { limit, offset, orderBy, orderDir } = searchParams;
		const forms = await formsService.listFormsForUser({
      accountId: account.id,
      limit,
      offset,
      orderBy,
      orderDir,
      userId: user.id,
    });
		const responseCount = await formsService.countResponsesForForms(account.id);
		return {
			forms,
			offset,
			limit,
			responseCount,
		};
	},
	{
		rateLimit: 'L1',
		searchParams: apiParamsSchema,
	}
) satisfies RequestHandler;
