import { createChallenge } from '$lib/server/altcha';
import { requestHandler } from '$lib/server/handlers';
import { EComplexity } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET = requestHandler(
	async (event) => {
		const maxNumber = event.url.searchParams.get('maxnumber');
		let complexity = event.url.searchParams.get('complexity') as EComplexity;
		if (!Object.values(EComplexity).includes(complexity)) {
			complexity = EComplexity.MEDIUM;
		}
		const { challenge } = await createChallenge({
			complexity,
			expire: event.url.searchParams.get('expire'),
			maxnumber: maxNumber ? parseInt(maxNumber, 10) : void 0,
			hmacKey: event.locals.apiKey.secret
		});
		return challenge;
	},
	{
		apiKeyFeatures: ['antispam_api'],
		authorization: 'apiKey',
		rateLimit: 'L1'
	}
) satisfies RequestHandler;
