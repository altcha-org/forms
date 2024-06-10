import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import { devicesService } from '$lib/server/services/devices.service';
import type { Actions } from './$types';

export const load = loadHandler(async (event) => {
	return {
		devices: await devicesService.listDevicesForUser(event.locals.user.id)
	};
});

export const actions = {
	deleteDevice: actionHandler(
		async (event, data) => {
			const device = await devicesService.findDevice(data.deviceId);
			if (device?.userId !== event.locals.user?.id) {
				throw new ForbiddenError();
			}
			await devicesService.deleteDevice(data.deviceId);
		},
		{
			body: t.Object({
				deviceId: t.String()
			})
		}
	)
} satisfies Actions;
