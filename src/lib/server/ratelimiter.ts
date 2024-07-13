import { Redis } from 'ioredis';
import { RateLimiterRedis, RateLimiterMemory, type RateLimiterRes } from 'rate-limiter-flexible';
import { env } from '$lib/server/env';
import type { RequestEvent } from '@sveltejs/kit';

const client = env.REDIS_URL
	? new Redis(env.REDIS_URL, {
			lazyConnect: true
		})
	: null;

export const LEVELS = ['L1', 'L2', 'L3'] as const;

const keyPrefix = 'rlimit:';

export const rateLimitLevels = LEVELS.reduce(
	(acc, level) => {
		const [points, duration] = env[`RATE_LIMIT_${level}` as keyof typeof env]?.split('/') || [];
		return {
			...acc,
			[level]: client
				? new RateLimiterRedis({
						storeClient: client,
						duration: +duration,
						inMemoryBlockOnConsumed: +points,
						points: +points,
						keyPrefix: keyPrefix + level
					})
				: new RateLimiterMemory({
						duration: +duration,
						points: +points
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
	let res: RateLimiterRes | Record<'msBeforeNext' | 'remainingPoints', unknown> | null = null;
	try {
		res = await limiter.consume(key);
	} catch (err) {
		if (typeof err === 'object' && err && 'msBeforeNext' in err && 'remainingPoints' in err) {
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
