import { Type as t } from '@sinclair/typebox';
import { usersService } from '$lib/server/services/users.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { FieldValidationError, ForbiddenError } from '$lib/server/errors';
import { generatePasskeyRegistration } from '../../shared.server';
import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = loadHandler(
	async ({ params }) => {
		const user = await usersService.findUserForRecovery(params.userId);
		const validLink = !!user && !!user.recoveryToken;
		const time = parseInt(user?.recoveryToken?.split('.')[0] || '0', 10);
		return {
			validLink,
			timeLeft: time ? Math.max(0, time - Date.now()) : 0,
			name: validLink ? user.name : null,
			passphraseRequired: validLink && !!user?.recoveryPassphrase,
			passphraseHint: validLink && user?.recoveryPassphraseHint
		};
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;

export const actions = {
	confirmRecovery: actionHandler(
		async (event, data) => {
			const user = await usersService.findUserForRecovery(event.params.userId);
			if (!user || !user.recoveryToken || user.emergency) {
				throw new ForbiddenError();
			}
			if (!verifyToken(user.recoveryToken, data.recoveryToken)) {
				throw new ForbiddenError();
			}
			if (
				user.recoveryPassphrase &&
				(!data.recoveryPassphrase ||
					!(await usersService.verifyRecoveryPassphrase(
						user.recoveryPassphrase,
						data.recoveryPassphrase
					)))
			) {
				throw new FieldValidationError(
					'recoveryPassphrase',
					event.locals.i18n('error.wrong_recovery_passphrase')
				);
			}
			await usersService.updateUser(user.id, {
				jwtNonce: usersService.generateJWTNonce(),
				recoveryToken: null
			});
			return generatePasskeyRegistration(user);
		},
		{
			authorization: false,
			body: t.Object({
				recoveryPassphrase: t.Optional(t.String()),
				recoveryToken: t.String()
			})
		}
	),
	cancelRecovery: actionHandler(
		async (event, data) => {
			const user = await usersService.findUserForRecovery(event.params.userId);
			if (!user || !user.recoveryToken) {
				throw new ForbiddenError();
			}
			if (user.recoveryToken !== data.recoveryToken) {
				throw new ForbiddenError();
			}
			await usersService.updateUser(user.id, {
				recoveryToken: null
			});
			throw redirect(303, '/app/authentication');
		},
		{
			authorization: false,
			body: t.Object({
				recoveryToken: t.String()
			})
		}
	)
} satisfies Actions;

function verifyToken(expectedRecoveryToken: string, recoveryToken: string, ttl: number = 86400000) {
	const time = +recoveryToken.split('.')[0];
	const now = Date.now();
	return (
		!!recoveryToken && expectedRecoveryToken === recoveryToken && time <= now && time + ttl > now
	);
}
