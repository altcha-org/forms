import { createChallenge, verifySolution } from '$lib/server/altcha';
import { Type as t } from '@sinclair/typebox';
import { apiKeysService } from '$lib/server/services/apiKeys.service';
import { ForbiddenError } from '$lib/server/errors';
import { compileSchema, validateSchema } from '$lib/server/validation';
import { rateLimit } from '$lib/server/ratelimiter';
import { requestHandler } from '$lib/server/handlers';
import { EComplexity } from '$lib/types';
import type { Payload } from 'altcha-lib/types';
import type { RequestHandler } from './$types';

const PostBody = compileSchema(
	t.Object({
		payload: t.String(),
		secret: t.String()
	})
);

export const OPTIONS = requestHandler(async (event) => {
	await rateLimit('L1', event);
	const origin = event.request.headers.get('origin');
	return new Response('', {
		headers: {
			'access-control-allow-origin': origin || '*',
			'access-control-allow-methods': 'GET,POST',
			'access-control-max-age': '86400',
			'referrer-policy': 'origin',
			vary: origin ? 'origin' : '*'
		},
		status: 204
	});
}, {
	authorization: false,
}) satisfies RequestHandler;

export const GET = requestHandler(async (event) => {
	await rateLimit('L1', event);
	const apiKey = await findApiKey(event.params.apiKey);
	const referrer = event.request.headers.get('referer');
	if ((apiKey.referrer && !referrer) || (referrer && !checkReferrer(apiKey.referrer, referrer))) {
		throw new ForbiddenError('Referrer does not match.');
	}
	const challenge = await createChallenge({
		// TODO: use api key complexity
		complexity: EComplexity.MEDIUM,
		expire: event.url.searchParams.get('expire'),
		hmacKey: apiKey.secret
	});
	return new Response(
		JSON.stringify({
			challenge
		}),
		{
			headers: {
				'content-type': 'application/json',
				expires: new Date(challenge.expire).toISOString()
			}
		}
	);
}, {
	authorization: false,
}) satisfies RequestHandler;

export const POST = requestHandler(async (event) => {
	await rateLimit('L2', event);
	const apiKey = await findApiKey(event.params.apiKey);
	const data = validateSchema(PostBody, await event.request.json());
	if (data.secret !== apiKey.secret) {
		throw new ForbiddenError();
	}
	const payload = JSON.parse(atob(data.payload)) as Payload;
	const saltParts = payload.salt.split('.');
	const expire = parseInt(saltParts[0], 10);
	let verified = false;
	if (expire && expire * 1000 > Date.now()) {
		verified = await verifySolution(payload, apiKey.secret);
	}
	return new Response(
		JSON.stringify({
			verified
		}),
		{
			headers: {
				'content-type': 'application/json'
			}
		}
	);
}, {
	authorization: false,
}) satisfies RequestHandler;

async function findApiKey(apiKeyId: string) {
	const apiKey = await apiKeysService.findApiKey(apiKeyId);
	if (!apiKey || apiKey.deleted) {
		throw new ForbiddenError();
	}
	return apiKey;
}

function checkReferrer(allowedReferrers: string, referrer: string) {
	return allowedReferrers.length === 0 || allowedReferrers.split(/\,|\;|\r?\n/).includes(referrer);
}
