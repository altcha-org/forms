import { randomBytes } from 'node:crypto';
import duration from 'parse-duration';
import { aes } from '@altcha/crypto';
import { generateAuthenticationOptions, generateRegistrationOptions } from '@simplewebauthn/server';
import { base64Encode } from '$lib/helpers';
import { verifyDeviceCookieForUser } from '$lib/server/middleware/device.middleware';
import { env, getAppBaseUrl } from '$lib/server/env';
import { hmac, roundTime } from '$lib/server/helpers';
import { devicesService, type IDevice } from '$lib/server/services/devices.service';
import { usersService, UsersService, type IUser } from '$lib/server/services/users.service';
import { invitesService } from '$lib/server/services/invites.service';
import { EEvents, eventsService } from '$lib/server/services/events.service';
import type { RequestEvent } from '@sveltejs/kit';

const DEVICE_COOKIE_EXPIRES = duration(env.DEVICE_COOKIE_EXPIRES) || duration('90d')!;
const HOSTNAME = new URL(getAppBaseUrl(), 'http://localhost').hostname;

export function generateWebAuthnChallenge(
	timeSec: number = Math.floor(Date.now() / 1000),
	rand: string = randomBytes(12).toString('hex')
) {
	const payload = timeSec + '.' + rand;
	return payload + '.' + hmac(payload);
}

export function verifyWebAuthnChallenge(challenge: string, expire: number = 3600) {
	const [timeSec, rand, signature] = challenge.split('.');
	return (
		timeSec &&
		rand &&
		signature &&
		+timeSec + expire > Math.floor(Date.now() / 1000) &&
		generateWebAuthnChallenge(+timeSec, rand) === challenge
	);
}

export async function upsertDevice(
	event: RequestEvent,
	user: Pick<IUser, 'accountsToUsers' | 'id' | 'locale' | 'email' | 'name'>,
	deviceName: string,
	deviceTimezone: string,
	trackEvent: boolean = true
) {
	await verifyDeviceCookieForUser(event, user.id);
	let device = event.locals.device;
	if (
		device &&
		(device.ipAddress !== event.locals.remoteAddress || device.timezone !== deviceTimezone)
	) {
		await devicesService.updateDevice(device.id, {
			expiresAt: roundTime(new Date(Date.now() + DEVICE_COOKIE_EXPIRES)),
			ipAddress: event.locals.remoteAddress,
			timezone: deviceTimezone
		});
	} else if (!device) {
		device = await devicesService.createDevice({
			encryptionKey: base64Encode(await aes.exportKey(await aes.generateKey())),
			expiresAt: roundTime(new Date(Date.now() + DEVICE_COOKIE_EXPIRES)),
			ipAddress: event.locals.remoteAddress,
			name: deviceName,
			timezone: deviceTimezone,
			userId: user.id
		});
		if (trackEvent) {
			const account = user.accountsToUsers[0]?.account;
			await eventsService.trackEvent({
				account,
				event: EEvents.DEVICES_CREATE,
				data: {
					device
				},
				user
			});
		}
	}
	return device;
}

export function setUserCookies(
	event: RequestEvent,
	user: Pick<IUser, 'id' | 'jwtNonce'>,
	device: IDevice
) {
	if (user) {
		event.cookies.set('user', usersService.generateJWT(user, device), {
			path: '/'
		});
	}
	if (device) {
		event.cookies.set(
			`device_${user.id}`,
			devicesService.generateJWT(device, DEVICE_COOKIE_EXPIRES),
			{
				maxAge: Math.floor(DEVICE_COOKIE_EXPIRES / 1000),
				path: '/'
			}
		);
	}
}

export async function createUser(
	data: Parameters<(typeof usersService)['createUser']>[0],
	inviteId?: string | null
) {
	const invite = inviteId ? await invitesService.findInvite(inviteId) : void 0;
	const user = await usersService.createUser(data, invite?.account?.id, invite?.role);
	if (invite && invite.email == data.email) {
		await invitesService.acceptInvite(user, invite.id);
	}
	return user;
}

export async function login(
	event: RequestEvent,
	user: NonNullable<Awaited<ReturnType<UsersService['findUserForWebauthn']>>>
) {
	const challenge = generateWebAuthnChallenge();
	const authentication = await generateAuthenticationOptions({
		challenge,
		rpID: HOSTNAME,
		allowCredentials:
			user?.webauthnAuthenticators.map((passkey) => {
				return {
					id: passkey.credentialID,
					transports: passkey.transports,
					type: 'public-key'
				};
			}) || []
	});
	return {
		challenge,
		authentication,
		userId: user.id
	};
}

export async function register(event: RequestEvent, email: string) {
	const inviteId = event.url.searchParams.get('invite');
	const user = await createUser(
		{
			email,
			locale: event.locals.locale
		},
		inviteId
	);
	return generatePasskeyRegistration(user);
}

export async function generatePasskeyRegistration(user: Pick<IUser, 'email' | 'id'>) {
	const challenge = generateWebAuthnChallenge();
	const registration = await generateRegistrationOptions({
		rpName: 'Altcha',
		rpID: HOSTNAME,
		userID: new TextEncoder().encode(user.id),
		userName: user.email!,
		attestationType: 'none',
		authenticatorSelection: {
			residentKey: 'required',
			userVerification: 'preferred'
		},
		challenge,
		excludeCredentials: []
	});
	return {
		challenge,
		registration,
		userId: user.id
	};
}
