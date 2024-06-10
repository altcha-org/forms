import { createHmac } from 'node:crypto';
import dns from 'node:dns/promises';
import { env } from '$lib/server/env';
import { ForbiddenError } from '$lib/server/errors';
import type { RequestEvent } from '@sveltejs/kit';
import type { IUser } from '$lib/server/services/users.service';

const dnsResolver = new dns.Resolver({
	timeout: 500,
	tries: 2
});

export async function readBody(event: RequestEvent) {
	const contentType = event.request.headers.get('content-type');
	if (contentType?.includes('application/json')) {
		return event.request.json();
	} else if (contentType?.includes('application/x-www-form-urlencoded')) {
		return Object.fromEntries(await event.request.formData());
	}
	return event.request.arrayBuffer();
}

export function checkUserAccountAccess(
	user: IUser | undefined,
	accountId: string,
	requiredRole?: 'admin'
) {
	const userAccount = user?.accountsToUsers.find(({ account }) => account.id === accountId);
	if (!userAccount) {
		throw new ForbiddenError();
	}
	if (requiredRole && userAccount.role !== requiredRole) {
		throw new ForbiddenError();
	}
}

export function hmac(data: string, alg: string = 'sha256') {
	return createHmac(alg, env.SIGNING_SECRET).update(data).digest('hex');
}

export function roundTime(time: Date | number, interval: number = 86400000) {
	return new Date(Math.floor((new Date(time).getTime() + interval) / interval) * interval);
}

export function parseHeaders(headers: string = '') {
	if (!headers) {
		return {};
	}
	return headers
		.split(/\r?\n/)
		.filter((line) => !!line)
		.reduce(
			(acc, line) => {
				const idx = line.indexOf(':');
				const name = line.slice(0, idx).trim();
				const value = line.slice(idx + 1).trim();
				if (name && value) {
					acc[name] = value;
				}
				return acc;
			},
			{} as Record<string, string>
		);
}

export async function verifyEmailMxDns(email: string) {
	const [_, domain] = email.split('@');
	try {
		const result = await dnsResolver.resolveMx(domain);
		return !!result?.length;
	} catch {
		// noop
	}
	return false;
}
