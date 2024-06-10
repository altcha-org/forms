import { env } from '$lib/server/env';
import { loadHandler } from '$lib/server/handlers';
import { license } from '$lib/server/license';
import { formMiddleware } from './shared';
import type { LayoutServerLoad } from './$types';

export const load = loadHandler(async (event) => {
	const { account, form } = await formMiddleware(event);
	return {
		account,
		accountRole: event.locals.user?.accountsToUsers.find(
			({ account }) => account.id === form.accountId
		)?.role,
		form,
		limitFileSize: form.account.plan?.limitFileSize || 10,
		licensed: license.valid
	};
}) satisfies LayoutServerLoad;
