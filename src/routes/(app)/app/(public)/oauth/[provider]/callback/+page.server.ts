import { redirect } from '@sveltejs/kit';
import { Type as t } from '@sinclair/typebox';
import { env } from '$lib/server/env';
import { usersService, type IUser } from '$lib/server/services/users.service';
import { actionHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import { getOAuthProvider } from '$lib/server/oauth';
import { createUser, setUserCookies, upsertDevice } from '../../../shared.server';
import type { Actions } from './$types';

export const actions = {
	default: actionHandler(
		async (event, data) => {
			const provider = event.params.provider;
			const code = event.url.searchParams.get('code');
			const state = new URLSearchParams(event.url.searchParams.get('state') || '');
			if (!code) {
				throw new ForbiddenError();
			}
			const { accessToken, profile } = await getOAuthProvider(event.params.provider).callback(code);
			let user = await usersService.findUserForWebauthn(profile.email);
			let userCreated = false;
			if (!user) {
				if (env.REGISTRATIONS_DISABLED === '1') {
					throw new ForbiddenError();
				}
				const { id } = await createUser(
					{
						email: profile.email,
						emailVerified: profile.emailVerified,
						name: profile.name,
						locale: event.locals.locale,
						oauthProvider: provider,
						oauthAccessToken: accessToken,
						oauthProfile: profile
					},
					state.get('invite')
				);
				user = await usersService.findUserForWebauthn(id);
				if (!user) {
					throw new ForbiddenError();
				}
				userCreated = true;
			} else if (
				user.deleted ||
				(user.oauthProvider && user.oauthProvider !== provider) ||
				user.webauthnAuthenticators?.length
			) {
				throw new ForbiddenError();
			} else {
				await usersService.updateUser(user.id, {
					oauthAccessToken: accessToken,
					oauthProvider: provider,
					oauthProfile: profile
				});
			}
			const device = await upsertDevice(
				event,
				user,
				data.deviceName,
				data.deviceTimezone,
				!userCreated
			);
			setUserCookies(event, user, device);
			throw redirect(303, '/app');
		},
		{
			authorization: false,
			body: t.Object({
				deviceName: t.String(),
				deviceTimezone: t.String()
			})
		}
	)
} satisfies Actions;
