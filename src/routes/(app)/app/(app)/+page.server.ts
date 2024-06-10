import { loadHandler } from '$lib/server/handlers.js';
import { invitesService } from '$lib/server/services/invites.service.js';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = loadHandler(
	async ({ locals }) => {
		if (locals.user) {
			if (locals.user.accountsToUsers.length === 1) {
				if (locals.user.email) {
					const invites = await invitesService.listInvitesForEmail(locals.user.email);
					if (!invites.length) {
						throw redirect(
							303,
							'/app/accounts/' + locals.user.accountsToUsers[0].account.id + '/dashboard'
						);
					}
				}
			}
			throw redirect(303, '/app/accounts');
		} else {
			throw redirect(303, '/app/authentication');
		}
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;
