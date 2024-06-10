import { Redis } from 'ioredis';
import { env } from './env.js';

const client = new Redis(env.REDIS_URL, {
	lazyConnect: true
});

const TTL = 86400 * 90;

export async function getAccountUsage(accountId: string, month?: string) {
	if (!month) {
		const date = new Date().toISOString().split('T')[0];
		month = date.slice(0, -3);
	}
	const value = await client.hgetall('account_usage:' + accountId + ':' + month);
	return Object.values(value).reduce((acc, n) => acc + +n, 0);
}

export async function incrementAccountUsage(accountId: string, apiKeyId: string) {
	const date = new Date().toISOString().split('T')[0];
	const month = date.slice(0, -3);
	const day = date.slice(-2);
	const accountKey = 'account_usage:' + accountId + ':' + month;
	const apieKeyKey = 'api_key_usage:' + apiKeyId + ':' + month;
	const result = await client
		.multi()
		.hincrby(accountKey, day, 1)
		.expire(accountKey, TTL, 'NX')
		.hincrby(apieKeyKey, day, 1)
		.expire(apieKeyKey, TTL, 'NX')
		.hgetall(accountKey)
		.exec();
	if (result) {
		const [_, hash] = result.pop() || [];
		if (hash) {
			return Object.values(hash).reduce((acc, n) => acc + +n, 0);
		}
	}
	return 0;
}
