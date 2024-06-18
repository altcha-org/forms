import { ForbiddenError } from '$lib/server/errors';
import { identitiesService } from '$lib/server/services/identities.service';
import { checkUserAccountAccess } from '$lib/server/helpers';
import type { RequestEvent } from '@sveltejs/kit';
import { accountsService } from '$lib/server/services/accounts.service';

export interface IIdentityMiddlewareOptions {
	requiredRole?: 'admin';
}

export async function identityMiddleware(
	event: RequestEvent<{ identityId: string }>,
	options: IIdentityMiddlewareOptions = {}
) {
	if (!event.locals.user) {
		throw new ForbiddenError();
	}
	const identity = await identitiesService.findIdentity(event.params.identityId);
	if (!identity) {
		throw new ForbiddenError();
	}
	const account = await accountsService.findAccount(identity.accountId);
	if (!account) {
		throw new ForbiddenError();
	}
	checkUserAccountAccess(event.locals.user, identity.accountId, options.requiredRole);
	return {
    account,
		identity,
	};
}
