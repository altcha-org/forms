import { error, redirect } from '@sveltejs/kit';
import { Type as t } from '@sinclair/typebox';
import argon2d from 'argon2';
import { env } from '$lib/server/env';
import { logger } from '$lib/server/logger';
import { usersService } from '$lib/server/services/users.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import { setUserCookies, upsertDevice } from '../../shared.server';
import { EEvents, eventsService } from '$lib/server/services/events.service';
import type { Actions, PageServerLoad } from './$types';

const EMERGENCY_ACCESS_ENABLED =
	env.EMERGENCY_ACCESS_DISABLED !== '1' && !!env.EMERGENCY_ACCESS_SECRET;

export const load = loadHandler(
	(event) => {
		if (!EMERGENCY_ACCESS_ENABLED || event.params.secret !== env.EMERGENCY_ACCESS_SECRET) {
			throw error(403, 'Wrong address.');
		}
		return {};
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;

export const actions = {
	default: actionHandler(
		async (event, data) => {
			if (!EMERGENCY_ACCESS_ENABLED || event.params.secret !== env.EMERGENCY_ACCESS_SECRET) {
				throw new ForbiddenError();
			}
			const user = await usersService.findUserForEmergency(data.email);
			if (!user || !user.emergency || !user.emergencyPassword) {
				throw new ForbiddenError();
			}
			const passwordOk = await argon2d.verify(user.emergencyPassword, data.password);
			if (!passwordOk) {
				throw new ForbiddenError();
			}
			const device = await upsertDevice(event, user, data.deviceName, data.deviceTimezone);
			logger.warn('Emergency Access Activated %o', {
				email: user.email,
				ipAddress: event.locals.remoteAddress,
				userId: user.id
			});
			await eventsService.trackEvent({
				account: user.accountsToUsers[0].account,
				event: EEvents.EMERGENCY_ACCESS,
				data: {
					device
				},
				ipAddress: event.locals.remoteAddress,
				user
			});
			setUserCookies(event, user, device);
			throw redirect(303, '/app');
		},
		{
			authorization: false,
			body: t.Object({
				deviceName: t.String(),
				deviceTimezone: t.String(),
				email: t.String({
					format: 'email'
				}),
				password: t.String({
					minLength: 8
				})
			}),
			rateLimit: 'L3'
		}
	)
} satisfies Actions;
