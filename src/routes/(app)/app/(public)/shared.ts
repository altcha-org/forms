import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { getDeviceName, getTimeZone } from '$lib/helpers';
import type {
	AuthenticationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialDescriptorJSON
} from '@simplewebauthn/types';

export async function initPasskeyRegistration(
	challenge: string,
	userId: string,
	registrationOptions: PublicKeyCredentialCreationOptionsJSON
): Promise<{ error?: string; success?: boolean }> {
	console.log('Passkey init registration');
	try {
		const registration = await startRegistration(registrationOptions);
		const resp = await fetch('/app/passkey/register', {
			body: JSON.stringify({
				challenge,
				deviceName: getDeviceName(),
				deviceTimezone: getTimeZone(),
				registration,
				userId
			}),
			headers: {
				'content-type': 'application/json'
			},
			method: 'POST'
		});
		if (resp.status >= 200 && resp.status <= 204) {
			return {
				success: true
			};
		} else if (resp.status >= 400) {
			return resp.json();
		}
	} catch (err: any) {
		console.error('Passkey sever error', err);
	}
	return {
		error: 'error.authentication_failed'
	};
}

export async function initPasskeyAuthentication(
	rpId: string,
	challenge: string,
	allowCredentials?: PublicKeyCredentialDescriptorJSON[]
): Promise<{ error?: string; success?: boolean }> {
	console.log('Passkey init auth');
	let authentication: AuthenticationResponseJSON | null = null;
	try {
		authentication = await startAuthentication(
			{
				challenge: isoBase64URL.fromUTF8String(challenge),
				rpId,
				userVerification: 'preferred',
				allowCredentials
			},
			allowCredentials === void 0
		);
	} catch (err: any) {
		console.log('Passkey error:', err);
		if (err?.name === 'NotAllowedError') {
			// canceled by user
			return {
				error: 'error.authentication_canceled'
			};
		} else if (err?.name === ' AbortError') {
			// timeout or re-init
			// noop
		} else {
			return {
				error: 'error.authentication_failed'
			};
		}
	}
	if (authentication) {
		try {
			const resp = await fetch('/app/passkey/authenticate', {
				body: JSON.stringify({
					authentication,
					challenge,
					deviceName: getDeviceName(),
					deviceTimezone: getTimeZone()
				}),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});
			if (resp.status >= 200 && resp.status <= 204) {
				return {
					success: true
				};
			} else if (resp.status >= 400) {
				return resp.json();
			}
		} catch (err: any) {
			console.error('Passkey server error', err);
		}
	}
	return {
		error: 'error.authentication_failed'
	};
}
