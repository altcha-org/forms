import { verifySolution } from '$lib/server/altcha';
import { Type as t } from '@sinclair/typebox';
import { requestHandler } from '$lib/server/handlers';
import type { RequestHandler } from './$types';

export const POST = requestHandler(async (event, body) => {
	const verified = await verifySolution(body.payload, event.locals.apiKey.secret);
  return {
    verified,
  };
}, {
  apiKeyFeatures: ['antispam_api'],
	authorization: 'apiKey',
  body: t.Object({
		payload: t.Union([t.Any(), t.String()]),
	}),
  rateLimit: 'L1',
}) satisfies RequestHandler;
