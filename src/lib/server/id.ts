import { customAlphabet } from 'nanoid';
import { env } from '$lib/server/env';

export const generateNanoId = customAlphabet('6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz', 30);

export enum EIdPrefix {
	ACCOUNT = 'acc',
	API_KEY = 'key',
	CHECKOUT = 'chk',
	DEVICE = 'dev',
	ENC_KEY = 'enc',
	FILE = 'file',
	FORM = 'form',
	IDENTITY = 'id',
	INVITE = 'inv',
	LOG = 'log',
	NOTE = 'note',
	RESPONSE = 'res',
	USER = 'usr'
}

export class IdGenerator {
	readonly MIN_LEN = 21;

	readonly TIME_LEN = 7;

	readonly REGION_LEN = 2;

	readonly REGION = String(env.REGION).padStart(2, '0').slice(0, this.REGION_LEN);

	constructor(readonly allowedPrefixes: string[] = Object.values(EIdPrefix)) {}

	nanoid(len: number = this.MIN_LEN) {
		const tlen = 7;
		const time = Math.floor(Date.now() / 1000)
			.toString(32)
			.slice(0, tlen);
		const rand = generateNanoId().slice(0, len - tlen - this.REGION_LEN);
		return time + this.REGION + rand;
	}

	prefixed(prefix: string, id?: string) {
		if (!this.allowedPrefixes.includes(prefix)) {
			throw new Error(`ID prefix ${prefix} is not allowed.`);
		}
		return prefix + '_' + (id ? id : this.nanoid());
	}

	decode(id: string, expectedPrefix?: EIdPrefix) {
		const [prefix, token] = id.split('_');
		if ((expectedPrefix && expectedPrefix !== prefix) || !token) {
			throw new Error('Invalid ID.');
		}
		const time = parseInt(token.slice(0, this.TIME_LEN), 32) * 1000;
		if (!time || isNaN(time)) {
			throw new Error('Invalid ID.');
		}
		const region = token.slice(this.TIME_LEN, this.TIME_LEN + this.REGION_LEN);
		return {
			prefix,
			region,
			time
		};
	}

	isValid(id: string, prefix?: EIdPrefix) {
		if (!id) {
			return false;
		}
		if (prefix) {
			return id.startsWith(prefix + '_') && id.length === this.MIN_LEN + prefix.length + 1;
		}
		return id.length === this.MIN_LEN;
	}
}

export const idgen = new IdGenerator();
