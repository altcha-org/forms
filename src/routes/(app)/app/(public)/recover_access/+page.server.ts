import { Type as t } from '@sinclair/typebox';
import { usersService } from '$lib/server/services/users.service';
import { actionHandler } from '$lib/server/handlers';
import type { Actions } from './$types';

export const actions = {
	default: actionHandler(
		async (event, data) => {
			// artificial delay
			await new Promise((resolve) => setTimeout(resolve, 5000));
			try {
				await usersService.requestRecovery(data.email);
			} catch (err) {
				// noop
			}
		},
		{
			authorization: false,
			body: t.Object({
				email: t.String({
					format: 'email'
				})
			})
		}
	)
} satisfies Actions;
