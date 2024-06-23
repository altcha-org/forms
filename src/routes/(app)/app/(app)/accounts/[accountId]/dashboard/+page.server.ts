import { actionHandler, loadHandler } from '$lib/server/handlers.js';
import { apiKeysService } from '$lib/server/services/apiKeys.service';
import { encryptionKeysService } from '$lib/server/services/encryptionKeys.service';
import { formsService } from '$lib/server/services/forms.service.js';
import { responsesService } from '$lib/server/services/responses.service';
import { usersService } from '$lib/server/services/users.service';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ locals, params, parent }) => {
	const accountId = params.accountId;
	const { user } = locals;
	const { account } = await parent();
	return {
		account,
		apiKeys: apiKeysService.countActiveApiKeysForAccount(params.accountId),
		encryptionKeys: encryptionKeysService.countActiveEncryptionKeysForAccount(params.accountId),
		count: formsService.countResponsesForForms(params.accountId),
		forms: await formsService.listFormsForUser({
			accountId,
			userId: user.id,
		}),
		responses: await responsesService.listResponsesForAccountAndUser({
			accountId,
			limit: 50,
			offset: 0,
			orderBy: 'id',
			orderDir: 'desc',
			userId: user.id,
		})
	};
}) satisfies PageServerLoad;

export const actions = {
	resendEmailVerification: actionHandler(async (event) => {
		await usersService.requestEmailVerification(event.locals.user.id);
	})
} satisfies Actions;
