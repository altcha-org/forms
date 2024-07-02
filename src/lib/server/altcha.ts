import { createHash, randomBytes } from 'node:crypto';
import duration from 'parse-duration';
import * as lib from 'altcha-lib';
import { env } from '$lib/server/env';
import { ForbiddenError, UnauthorizedError } from './errors';
import { EComplexity } from '$lib/types';
import type { Payload } from 'altcha-lib/types';
import type { RequestEvent } from '@sveltejs/kit';

const EXPIRE_DEFAULT = 3600_000;

export interface ICreateChanllengeOptions {
	complexity?: EComplexity | null;
	expire?: string | null;
	hmacKey: string;
	maxnumber?: number | null;
}

export function createHmacKey(formId: string) {
	return createHash('sha256').update([formId, env.SIGNING_SECRET].join('.')).digest('hex');
}

export function getMaxNumberForComplexity(complexity: EComplexity) {
	switch (complexity) {
		case EComplexity.HIGH:
			return 100_000;
		case EComplexity.MEDIUM:
			return 50_000;
		case EComplexity.LOW:
		default:
			return 10_000;
	}
}

export async function createChallenge(options: ICreateChanllengeOptions) {
	const expire = duration(options.expire || '') || EXPIRE_DEFAULT;
	const challenge = await lib.createChallenge({
		algorithm: 'SHA-256',
		hmacKey: options.hmacKey,
		maxNumber:
			options.maxnumber || getMaxNumberForComplexity(options.complexity || EComplexity.MEDIUM),
		expires: new Date(Date.now() + expire),
	});
	return {
		challenge,
		expire,
	};
}

export async function verifySolution(payload: string | Payload, hmacKey: string) {
	const parsed = typeof payload === 'string' ? (JSON.parse(atob(payload)) as Payload) : payload;
	if (!parsed.salt || !parsed.challenge || parsed.number === void 0) {
		return false;
	}
	return lib.verifySolution(parsed, hmacKey);
}

export async function protectedEndpoint(event: RequestEvent, hmacKey: string) {
	const altcha = event.request.headers.get('authorization');
	if (!altcha) {
		const { challenge, expire } = await createChallenge({
			hmacKey,
			maxnumber: 10000
		});
		event.setHeaders({
			'www-authenticate': `Altcha challenge=${JSON.stringify(challenge)}, expire=${expire / 1000}`
		});
		throw new UnauthorizedError();
	}
	let ok = false;
	try {
		const parts = altcha.split(' ');
		const payload = parts.find((p) => p.startsWith('payload='))?.slice(8);
		ok = !!payload && (await verifySolution(JSON.parse(payload), hmacKey));
	} catch {
		// noop
	}
	if (!ok) {
		throw new ForbiddenError();
	}
}
