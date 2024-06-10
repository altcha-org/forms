import { type RequestEvent } from '@sveltejs/kit';
import { devicesService } from '$lib/server/services/devices.service';

export default () => {
	return async (event: RequestEvent) => {
		if (event.locals.user) {
			await verifyDeviceCookieForUser(event, event.locals.user.id);
		}
	};
};

export async function verifyDeviceCookieForUser(event: RequestEvent, userId: string) {
	const deviceCookieName = `device_${userId}`;
	const deviceCookie = event.cookies.get(deviceCookieName);
	let payload: ReturnType<typeof devicesService.verifyJWT> | undefined = void 0;
	if (deviceCookie) {
		try {
			payload = devicesService.verifyJWT(deviceCookie);
			if (payload.deviceId) {
				event.locals.deviceId = payload.deviceId;
			} else {
				// delete device cookie otherwise
				event.cookies.delete(deviceCookieName, {
					path: '/'
				});
			}
		} catch {
			// noop
		}
	}
	if (event.locals.deviceId) {
		const device = await devicesService.findDevice(event.locals.deviceId);
		if (device && device.userId === userId) {
			event.locals.device = device;
			const nowSec = Math.floor(Date.now() / 1000);
			if (payload?.expire && payload?.issued) {
				const ttl = payload.expire - payload.issued;
				if (payload.issued + ttl * 0.5 < nowSec) {
					// renew jwt
					event.cookies.set(deviceCookieName, devicesService.generateJWT(device, ttl), {
						path: '/'
					});
				}
			}
		}
	}
	if (!event.locals.device) {
		// logout and redirect to login
		event.cookies.delete(deviceCookieName, {
			path: '/'
		});
		event.cookies.delete('user', {
			path: '/'
		});
	}
}
