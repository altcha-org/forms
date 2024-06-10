import pino from 'pino';
import { env } from '$lib/server/env';

export const logger = pino().child({
	nodeId: env.NODE_ID,
	version: env.VERSION
});
