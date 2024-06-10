import { usersService } from '$lib/server/services/users.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async ({ params }) => {
		const user = await usersService.findUserForEmailVerification(params.userId);
		const ok = user && user.emailVerificationToken === params.token;
		return {
			email: ok ? user?.email : null
		};
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;

export const actions = {
	default: actionHandler(
		async (event) => {
			const user = await usersService.findUserForEmailVerification(event.params.userId);
			const ok = user && user.emailVerificationToken === event.params.token;
			if (!ok) {
				throw new ForbiddenError();
			}
			await usersService.updateUser(user.id, {
				emailVerified: true,
				emailVerificationToken: null
			});
		},
		{
			authorization: false
		}
	)
} satisfies Actions;
