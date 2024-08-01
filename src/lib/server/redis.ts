import { Redis } from 'ioredis';
import { env } from './env.js';

const client = env.REDIS_URL
	? new Redis(env.REDIS_URL, {
			lazyConnect: true,
			maxRetriesPerRequest: 3,
			commandTimeout: 1500,
		})
	: null;

const TTL = 86400 * 90;
const ACCOUNT_KEY_PREFIX = 'account_usage:';
const API_KEY_PREFIX = 'api_key_usage:';

export async function getAccountUsage(accountId: string, month?: string) {
	if (!client) {
		return null;
	}
	if (!month) {
		month = getCurrentMonth();
	}
	const date = new Date(month + '-01T00:00:00');
	const value = await client.hgetall(ACCOUNT_KEY_PREFIX + accountId + ':' + month);
	const entries = Object.entries(value || ({} as object));
	return reduceDays(date, entries);
}

export async function getApiKeyUsage(apiKeyId: string, month?: string) {
	if (!client) {
		return null;
	}
	if (!month) {
		month = getCurrentMonth();
	}
	const date = new Date(month + '-01T00:00:00');
	const value = await client.hgetall(API_KEY_PREFIX + apiKeyId + ':' + month);
	const entries = Object.entries(value || ({} as object));
	const requests = entries.reduce((acc, [k, n]) => acc + (k.startsWith('_') ? 0 : +n), 0);
	const classifications = entries.reduce(
		(acc, [k, n]) => {
			if (k.startsWith('_c:')) {
				acc[k.slice(3)] = +n;
			}
			return acc;
		},
		{
			BAD: 0,
			GOOD: 0,
			NEUTRAL: 0
		} as Record<string, number>
	);
	const referrers = entries.reduce(
		(acc, [k, n]) => {
			if (k.startsWith('_r:')) {
				acc[k.slice(3)] = +n;
			}
			return acc;
		},
		{} as Record<string, number>
	);
	return {
		classifications,
		referrers,
		requests,
		...reduceDays(date, entries)
	};
}

export async function incrementAccountUsage(
	accountId: string,
	apiKeyId: string,
	referrer?: string
) {
	if (!client) {
		return 0;
	}
	const date = new Date().toISOString().split('T')[0];
	const month = date.slice(0, -3);
	const day = date.slice(-2);
	const accountKey = ACCOUNT_KEY_PREFIX + accountId + ':' + month;
	const apiKeyKey = API_KEY_PREFIX + apiKeyId + ':' + month;
	let multi = client
		.multi()
		.hincrby(accountKey, day, 1)
		.expire(accountKey, TTL, 'NX')
		.hincrby(apiKeyKey, day, 1)
		.expire(apiKeyKey, TTL, 'NX')
		.hgetall(accountKey);
	if (referrer) {
		multi = multi.hincrby(apiKeyKey, '_r:' + referrer, 1);
	}
	const result = await multi.exec();
	if (result) {
		const [_, hash] = result.pop() || [];
		if (hash) {
			return Object.entries(hash).reduce((acc, [k, n]) => acc + (k.startsWith('_') ? 0 : +n), 0);
		}
	}
	return 0;
}

export async function registerChallengeUse(challenge: string, expire: number = 3600) {
	if (!client) {
		return null;
	}
	const key = 'chlng:' + challenge;
	const result = await client.multi().get(key).setnx(key, 1).expire(key, expire, 'NX').exec();
	if (result) {
		const [prev] = result;
		return !!prev[1];
	}
	return null;
}

export async function acquireLock(key: string, ttl: number = 5000, retries: number = 10, retryDelay: number = 200) {
	if (!client) {
		return null;
	}
	const res = await client.set('lock:' + key, 1, 'PX', ttl, 'NX');
	if (!res && retries < 1) {
		return false;
	} else if (res) {
		return true;
	}
	await new Promise((resolve) => setTimeout(resolve, retryDelay));
	return acquireLock(key, ttl, retries - 1, retryDelay);
}

export async function releaseLock(key: string) {
	if (!client) {
		return null;
	}
	return client.del('lock:' + key);
}

function getCurrentMonth() {
	const date = new Date().toISOString().split('T')[0];
	return date.slice(0, -3);
}

function reduceDays(date: Date, entries: [string, string][]) {
	const monthDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const days: { date: string; requests: number }[] = [];
	for (let i = 1; i <= monthDays; i++) {
		const dayDate = new Date(date);
		dayDate.setDate(i);
		days.push({
			date: dayDate.toISOString().split('T')[0],
			requests: parseInt(entries.find(([k]) => k === String(i).padStart(2, '0'))?.[1] || '0', 10)
		});
	}
	return {
		days,
		sum: entries.reduce((acc, [k, n]) => acc + (k.startsWith('_') ? 0 : +n), 0)
	};
}
