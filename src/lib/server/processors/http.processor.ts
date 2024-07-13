import qs from 'node:querystring';
import isValidDomain from 'is-valid-domain';
import { env } from '$lib/server/env';
import { BaseProcessor } from '$lib/server/processors/base.processor';
import { parseHeaders } from '$lib/server/helpers';
import { rateLimitByKey } from '$lib/server/ratelimiter';
import type { ProcessorContext } from '$lib/server/services/forms.service';
import type { TResponseData } from '$lib/types';

const RETRY_DELAY = 5000;
const MAX_TIMEOUT = 15000;

export interface IMakeRequestOptions {
	headers: Record<string, string | undefined>;
	method: string;
	retry?: boolean;
	timeout?: number;
	url: URL | string;
}

export class HttpProcessor extends BaseProcessor<{
	contentType?: string;
	headers?: string;
	method?: string;
	timeout?: number;
	url: string;
}> {
	async run(ctx: ProcessorContext, data: TResponseData): Promise<void> {
		const options = this.getOptions(ctx, data);
		if (ctx.form.account.plan?.featureProcessors !== true) {
			throw new Error(`Not allowed for your billing plan.`);
		}
		try {
			await rateLimitByKey('L3', 'http:' + ctx.form.accountId);
		} catch (err) {
			throw new Error(`Too many requests.`);
		}
		const url = new URL(options.url);
		if (!isValidDomain(url.hostname)) {
			throw new Error(`URL not allowed.`);
		}
		ctx.log(`${options.method} ${options.url.replace(/\?.*/, '?...')}`);
		await makeRequest(ctx, data, {
			method: options.method || 'POST',
			headers: {
				'content-type': options.contentType,
				...parseHeaders(options.headers)
			},
			retry: true,
			url
		});
	}
}

async function makeRequest(
	ctx: ProcessorContext,
	data: TResponseData,
	options: IMakeRequestOptions
) {
	const controller = new AbortController();
	const tm = setTimeout(
		() => {
			controller.abort();
		},
		Math.min(MAX_TIMEOUT, Math.max(MAX_TIMEOUT, options.timeout || 0))
	);
	let resp: Response | undefined = void 0;
	try {
		const { body, headers } = encodeBody(data, options.headers['content-type']);
		resp = await fetch(options.url, {
			// @ts-expect-error ts error
			duplex: 'half',
			body,
			headers: {
				...options.headers,
				...headers,
				'user-agent': `altcha-forms/${env.VERSION}`
			} as Record<string, string>,
			method: options.method,
			signal: controller.signal
		});
	} catch (err) {
		ctx.log(
			`(http) Error: ${typeof err === 'object' && err && 'message' in err ? err.message : ''} ${typeof err === 'object' && err && 'cause' in err && err.cause && typeof err.cause === 'object' && 'code' in err.cause ? err.cause?.code : ''}]`,
			void 0,
			true
		);
	}
	clearTimeout(tm);
	if (resp) {
		ctx.log(`${resp.status} ${resp.statusText}`);
	}
	if (!resp || resp.status >= 500) {
		if (options.retry) {
			ctx.log(`(http) Retrying request in ${RETRY_DELAY}ms...`);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
			return makeRequest(ctx, data, {
				...options,
				retry: false
			});
		} else {
			throw new Error(`Server responded with ${resp?.status || 0}`);
		}
	}
	return resp;
}

function encodeBody(
	data: TResponseData,
	contentType: string = 'application/x-www-form-urlencoded'
) {
	const type = contentType.split(';')[0];
	let formData: FormData;
	let req: Request;
	switch (type) {
		case 'application/json':
			return {
				body: JSON.stringify(data),
				headers: {
					'content-type': contentType
				}
			};
		case 'application/x-www-form-urlencoded':
			return {
				body: qs.encode(data as Record<string, string>),
				headers: {
					'content-type': contentType
				}
			};
		case 'multipart/form-data':
			formData = new FormData();
			for (const name in data) {
				formData.append(name, String(data[name]));
			}
			req = new Request('http://localhost', {
				// @ts-expect-error ts error
				duplex: 'half',
				body: formData,
				method: 'POST'
			});
			return {
				body: req.body,
				headers: Object.fromEntries(req.headers)
			};
		default:
			throw new Error('Unsupported content-type header.');
	}
}
