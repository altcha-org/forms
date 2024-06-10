import { loadHandler } from '$lib/server/handlers.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = loadHandler(({ cookies }) => {
	cookies.delete('user', {
		path: '/'
	});
	cookies.delete('user_jwt_expires', {
		path: '/'
	});
	throw redirect(303, '/app/authentication');
}) satisfies PageServerLoad;
