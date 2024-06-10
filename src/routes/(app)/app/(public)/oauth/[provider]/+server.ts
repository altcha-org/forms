import { requestHandler } from '$lib/server/handlers';
import { redirect } from '@sveltejs/kit';
import { getOAuthProvider } from '$lib/server/oauth';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event) => {
		const inviteId = event.url.searchParams.get('invite');
		const state = new URLSearchParams();
		if (inviteId) {
			state.set('invite', inviteId);
		}
		const { authorizationUri } = await getOAuthProvider(event.params.provider).authorize(state);
		throw redirect(303, authorizationUri);
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
