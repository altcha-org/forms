import pino from 'pino';
import { env } from '$lib/server/env';

export const logger = pino({
	level: env.LOG_LEVEL || 'info'
}).child({
	nodeId: env.NODE_ID,
	version: env.VERSION
});
