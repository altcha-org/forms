import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import { usersService } from '$lib/server/services/users.service';
import type { Actions } from './$types';

export const load = loadHandler(async (event) => {
	const user = await usersService.findUserForWebauthn(event.locals.user.id);
	if (!user) {
		throw new ForbiddenError();
	}
	return {
		passkeys: user.webauthnAuthenticators
	};
});

export const actions = {
	deletePasskey: actionHandler(
		async (event, data) => {
			const user = await usersService.findUserForWebauthn(event.locals.user.id);
			if (user) {
				await usersService.updateUser(user.id, {
					webauthnAuthenticators: user.webauthnAuthenticators.filter(
						({ credentialID }) => credentialID !== data.passkeyId
					)
				});
			}
		},
		{
			body: t.Object({
				passkeyId: t.String()
			})
		}
	)
} satisfies Actions;
