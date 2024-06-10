import {
	verifyRegistrationResponse,
	type VerifiedRegistrationResponse
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { Type as t } from '@sinclair/typebox';
import { getAppBaseUrl } from '$lib/server/env';
import { requestHandler } from '$lib/server/handlers';
import { usersService } from '$lib/server/services/users.service';
import { ForbiddenError } from '$lib/server/errors';
import { logger } from '$lib/server/logger';
import { setUserCookies, upsertDevice, verifyWebAuthnChallenge } from '../../shared.server';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';
import type { WebAuthnAuthenticator } from '$lib/types';
import type { RequestHandler } from './$types';

const BASE_URL = new URL(getAppBaseUrl(), 'http://localhost');
const HOSTNAME = BASE_URL.hostname;
const ORIGIN = BASE_URL.origin;

export const POST = requestHandler(
	async (event, data) => {
		const i18n = event.locals.i18n;
		const user = await usersService.findUserForWebauthn(data.userId);
		if (!user || user.deleted) {
			throw new ForbiddenError();
		}
		if (!verifyWebAuthnChallenge(data.challenge)) {
			throw new ForbiddenError(i18n('error.passkey_expired_try_again'));
		}
		let verification: VerifiedRegistrationResponse | null = null;
		try {
			verification = await verifyRegistrationResponse({
				response: data.registration as RegistrationResponseJSON,
				expectedChallenge: isoBase64URL.fromUTF8String(data.challenge),
				expectedOrigin: ORIGIN,
				expectedRPID: HOSTNAME,
				requireUserVerification: true
			});
		} catch (err: any) {
			logger.error(err, 'WebAuthn Registration Error');
			throw new ForbiddenError(i18n('error.something_went_wrong'));
		}
		if (!verification?.verified) {
			throw new ForbiddenError(i18n('error.something_went_wrong'));
		}
		const { registrationInfo } = verification;
		const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
			registrationInfo!;
		const authenticator: WebAuthnAuthenticator & { deviceName: string } = {
			credentialID,
			credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
			counter,
			credentialDeviceType,
			credentialBackedUp,
			deviceName: data.deviceName,
			transports: data.registration.response.transports
		};
		await usersService.updateUser(user.id, {
			webauthnAuthenticators: [...user.webauthnAuthenticators, authenticator]
		});
		const device = await upsertDevice(event, user, data.deviceName, data.deviceTimezone, false);
		setUserCookies(event, user, device);
	},
	{
		authorization: false,
		body: t.Object({
			challenge: t.String(),
			deviceName: t.String(),
			deviceTimezone: t.String(),
			userId: t.String(),
			registration: t.Record(t.String(), t.Any())
		})
	}
) satisfies RequestHandler;
