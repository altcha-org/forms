import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import { filesService } from '$lib/server/services/files.service';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event) => {
		const { account } = event.locals;
		if (!account) {
			throw new ForbiddenError();
		}
		const response = await responsesService.findResponse(event.params.responseId);
    if (response?.accountId !== account.id) {
			throw new ForbiddenError();
    }
    const role = event.locals.user.accountsToUsers.find(
      ({ account }) => account.id === response.form.accountId
    )?.role;
    if (response.form.restricted && role !== 'admin' && !response.form.formsToUsers.some(({ userId }) => userId === event.locals.user?.id)) {
      throw new ForbiddenError();
    }
    const files = response.files.map(({ id }) => id);
    return {
      files: files.length ? await filesService.findFilesBulk(files).catch(() => []) : Promise.resolve([]),
    };
	},
	{
		rateLimit: 'L1',
	}
) satisfies RequestHandler;
