import { usersService } from '$lib/server/services/users.service';
import type { RequestEvent } from '@sveltejs/kit';

const JWT_EXPIRES_COOKIE_NO_SET = ['/(app)/storage/[fileId]'];

export default () => {
	return async (event: RequestEvent) => {
		const jwt = event.cookies.get('user');
		if (jwt) {
			let payload: ReturnType<typeof usersService.verifyJWT> | undefined = void 0;
			try {
				payload = usersService.verifyJWT(jwt);
			} catch {
				// noop
			}
			if (payload?.nonce && payload?.userId) {
				const user = await usersService.findUser(payload.userId);
				if (user && user.jwtNonce === payload.nonce) {
					event.locals.user = user;
					if (event.params.accountId) {
						event.locals.account = user.accountsToUsers.find(
							({ account }) => account.id === event.params.accountId
						)?.account;
					}
					const nowSec = Math.floor(Date.now() / 1000);
					let expires: number | null = null;
					if (payload.expire && payload.issued) {
						const ttl = payload.expire - payload.issued;
						if (payload.issued + ttl * 0.5 < nowSec) {
							// renew jwt
							event.cookies.set('user', usersService.generateJWT(user, event.locals.device), {
								path: '/'
							});
							expires = ttl;
						} else {
							expires = payload.expire - nowSec;
						}
						if (expires !== null && !JWT_EXPIRES_COOKIE_NO_SET.includes(event.route.id || '')) {
							event.cookies.set('user_jwt_expires', String(expires), {
								path: '/',
								httpOnly: false
							});
						}
					}
					return;
				}
			}
			// delete jwt cookie otherwise
			event.cookies.delete('user', {
				path: '/'
			});
		}
	};
};
