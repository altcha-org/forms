import { redirect } from '@sveltejs/kit';
import { Type as t } from '@sinclair/typebox';
import { env } from '$lib/server/env';
import { usersService } from '$lib/server/services/users.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { FieldValidationError } from '$lib/server/errors';
import { AVAILABLE_OAUTH_PROVIDERS } from '$lib/server/oauth';
import { generateWebAuthnChallenge, login, register } from '../shared.server';
import { verifyEmailMxDns } from '$lib/server/helpers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	(event) => {
		if (event.locals.user) {
			throw redirect(303, '/app');
		}
		const webAuthnDisabled = env.PASSKEYS_DISABLED === '1';
		return {
			oauthProviders: AVAILABLE_OAUTH_PROVIDERS,
			webAuthnDisabled,
			webAuthnChallenge: !webAuthnDisabled && generateWebAuthnChallenge()
		};
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;

export const actions = {
	passkey: actionHandler(
		async (event, data) => {
			const user = await usersService.findUserForWebauthn(data.email);
			if (user && !user.webauthnAuthenticators) {
				// registered w/out webnauth
				throw new FieldValidationError(
					'email',
					event.locals.i18n('error.user_registered_without_passkey')
				);
			} else if (!user) {
				if (env.REGISTRATIONS_EMAIL_DNS_CHECK_DISABLED === '0') {
					const validEmail = await verifyEmailMxDns(data.email);
					if (!validEmail) {
						throw new FieldValidationError('email', event.locals.i18n('error.invalid_email_domain'));
					}
				}
				return {
					email: data.email,
					requestRegistration: env.REGISTRATIONS_DISABLED !== '1'
				};
			}
			return login(event, user);
		},
		{
			authorization: false,
			body: t.Object({
				email: t.String({
					format: 'email'
				})
			}),
			rateLimit: 'L3'
		}
	),
	register: actionHandler(
		async (event, data) => {
			const user = await usersService.findUserForWebauthn(data.email);
			if (user) {
				throw new FieldValidationError(
					'email',
					event.locals.i18n('error.user_registered_without_passkey')
				);
			} else {
				if (env.REGISTRATIONS_EMAIL_DNS_CHECK_DISABLED === '0') {
					const validEmail = await verifyEmailMxDns(data.email);
					if (!validEmail) {
						throw new FieldValidationError('email', event.locals.i18n('error.invalid_email_domain'));
					}
				}
				return register(event, data.email);
			}
		},
		{
			authorization: false,
			body: t.Object({
				email: t.String({
					format: 'email'
				})
			}),
			rateLimit: 'L3'
		}
	)
} satisfies Actions;
