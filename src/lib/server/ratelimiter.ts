import { Redis } from 'ioredis';
import { RateLimiterRedis, type RateLimiterRes } from 'rate-limiter-flexible';
import { env } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

const client = new Redis(env.REDIS_URL, {
	lazyConnect: true
});

export const LEVELS = ['L1', 'L2', 'L3'] as const;

const keyPrefix = 'rlimit:';

export const rateLimitLevels = LEVELS.reduce(
	(acc, level) => {
		const [points, duration] = env[`RATE_LIMIT_${level}` as keyof typeof env]?.split('/') || [];
		return {
			...acc,
			[level]: new RateLimiterRedis({
				storeClient: client,
				duration: +duration,
				inMemoryBlockOnConsumed: +points,
				points: +points,
				keyPrefix: keyPrefix + level
			})
		};
	},
	{} as Record<(typeof LEVELS)[number], RateLimiterRedis>
);

export async function rateLimitByKey(level: keyof typeof rateLimitLevels, key: string) {
	const limiter = rateLimitLevels[level];
	return limiter.consume(key);
}

export async function rateLimit<T extends RequestEvent = RequestEvent>(
	level: keyof typeof rateLimitLevels,
	event: T,
	key: string = event.locals.apiKey?.id || event.locals.remoteAddress
) {
	const limiter = rateLimitLevels[level];
	let res: RateLimiterRes | null = null;
	try {
		res = await limiter.consume(key);
	} catch (err: any) {
		if ('msBeforeNext' in err) {
			res = err;
		} else {
			throw err;
		}
	} finally {
		if (res) {
			event.setHeaders({
				'X-Rate-Limit-Limit': String(limiter.points),
				'X-Rate-Limit-Remaining': String(res.remainingPoints),
				'X-Rate-Limit-Reset': String(res.msBeforeNext)
			});
		}
	}
}
