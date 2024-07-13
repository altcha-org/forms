import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { usersService } from '$lib/server/services/users.service';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions } from './$types';

export const load = loadHandler(async (event) => {
	const user = await usersService.findUserForRecovery(event.locals.user.id);
	if (!user) {
		throw new ForbiddenError();
	}
	return {
		email: user.email,
		name: user.name,
		hasRecoveryPassphrase: !!user.recoveryPassphrase,
		recovertPassphraseHint: user.recoveryPassphraseHint
	};
});

export const actions = {
	save: actionHandler(
		async (event, data) => {
			await usersService.updateUser(event.locals.user.id, {
				email: data.email,
				name: data.name,
				recoveryPassphrase: data.recovertPassphrase,
				recoveryPassphraseHint: data.recovertPassphraseHint
			});
		},
		{
			body: t.Object({
				email: t.String({
					format: 'email'
				}),
				name: t.String({
					minLength: 1
				}),
				recovertPassphrase: t.Optional(t.String()),
				recovertPassphraseHint: t.Optional(t.String())
			})
		}
	),
	removeRecoveryPassphrase: actionHandler(async (event) => {
		await usersService.updateUser(event.locals.user.id, {
			recoveryPassphrase: null,
			recoveryPassphraseHint: null
		});
	})
} satisfies Actions;
