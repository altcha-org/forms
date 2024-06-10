import {
	verifyAuthenticationResponse,
	type VerifiedAuthenticationResponse
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { Type as t } from '@sinclair/typebox';
import { getAppBaseUrl } from '$lib/server/env';
import { requestHandler } from '$lib/server/handlers';
import { usersService } from '$lib/server/services/users.service';
import { ForbiddenError } from '$lib/server/errors';
import { logger } from '$lib/server/logger';
import { setUserCookies, upsertDevice, verifyWebAuthnChallenge } from '../../shared.server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';
import type { RequestHandler } from './$types';

const APP_URL = new URL(getAppBaseUrl(), 'http://localhost');
const HOSTNAME = APP_URL.hostname;
const ORIGIN = APP_URL.origin;

export const POST = requestHandler(
	async (event, data) => {
		const i18n = event.locals.i18n;
		const userId = data.authentication?.response?.userHandle;
		if (!userId) {
			throw new ForbiddenError();
		}
		const user = await usersService.findUserForWebauthn(isoBase64URL.toUTF8String(userId));
		if (!user || user?.deleted) {
			throw new ForbiddenError(i18n('error.user_not_found'));
		}
		const authenticator = user.webauthnAuthenticators.find(
			(auth: any) => auth.credentialID === data.authentication.id
		);
		if (!authenticator) {
			throw new ForbiddenError(i18n('error.passkey_not_found'));
		}
		if (!verifyWebAuthnChallenge(data.challenge)) {
			throw new ForbiddenError(i18n('error.passkey_expired_try_again'));
		}
		let verification: VerifiedAuthenticationResponse | null = null;
		try {
			verification = await verifyAuthenticationResponse({
				response: data.authentication as AuthenticationResponseJSON,
				expectedChallenge: isoBase64URL.fromUTF8String(data.challenge),
				expectedOrigin: ORIGIN,
				expectedRPID: HOSTNAME,
				authenticator: {
					...authenticator,
					credentialID: authenticator.credentialID,
					credentialPublicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey)
				},
				requireUserVerification: true
			});
		} catch (err: any) {
			logger.error(err, 'WebAuthn Authentication Error');
			throw new ForbiddenError(i18n('error.something_went_wrong'));
		}
		if (verification?.verified) {
			const device = await upsertDevice(event, user, data.deviceName, data.deviceTimezone);
			setUserCookies(event, user, device);
		}
	},
	{
		authorization: false,
		body: t.Object({
			authentication: t.Record(t.String(), t.Any()),
			challenge: t.String(),
			deviceName: t.String(),
			deviceTimezone: t.String()
		})
	}
) satisfies RequestHandler;
