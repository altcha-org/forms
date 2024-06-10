import { redirect } from '@sveltejs/kit';
import { usersService } from '$lib/server/services/users.service';
import { actionHandler } from '$lib/server/handlers';
import type { Actions } from './$types';

export const actions = {
	deleteProfile: actionHandler(async (event) => {
		await usersService.deleteUser(event.locals.user.id);
		event.cookies.delete('user', {
			path: '/'
		});
		throw redirect(303, '/app/authentication?userDeleted=true');
	})
} satisfies Actions;
