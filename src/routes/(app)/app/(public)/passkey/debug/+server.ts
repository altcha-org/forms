import { Type as t } from '@sinclair/typebox';
import { requestHandler } from '$lib/server/handlers';
import { logger } from '$lib/server/logger';
import type { RequestHandler } from './$types';

// ONLY FOR DEBUGING PASSKEY ERRORS DURING BETA

export const POST = requestHandler(
	async (event, data) => {
		logger.error('Passkey error %o', data);
	},
	{
		authorization: false,
		body: t.Object({
			deviceName: t.String(),
			kind: t.String(),
			userId: t.String(),
			error: t.String()
		})
	}
) satisfies RequestHandler;
