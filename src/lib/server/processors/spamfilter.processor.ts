import { env } from '$lib/server/env';
import { parseHeaders } from '$lib/server/helpers';
import { BaseProcessor } from '$lib/server/processors/base.processor';
import type { ProcessorContext } from '$lib/server/services/forms.service';
import type { TResponseData } from '$lib/types';

const SPAM_FILTER_HEADERS = parseHeaders(env.SPAM_FILTER_HEADERS || '');

export class SpamfilterProcessor extends BaseProcessor<{
	rejectSpam: boolean;
}> {
	async run(context: ProcessorContext, data: TResponseData): Promise<void> {
		if (!env.SPAM_FILTER_URL) {
			throw new Error(`Env variable SPAM_FILTER_URL is not configured.`);
		}
		const emailBlocks: string[] = [];
		const textBlocks: string[] = [];
		for (const step of context.form.steps) {
			for (const block of step.blocks) {
				if (block.type === 'EmailInput') {
					emailBlocks.push(block.name);
				} else if (['TextInput', 'MultiLineTextInput'].includes(block.type)) {
					textBlocks.push(block.name);
				}
			}
		}
		const body = {
			email: emailBlocks.length ? data[emailBlocks[0]] : void 0,
			ipAddress: context.get('ip_address'),
			text: textBlocks.map((name) => data[name] || '').join('\n'),
			timeZone: context.get('timezone')
		};
		const json = await makeRequest(env.SPAM_FILTER_URL, body);
		const { classification, reasons, score } = json;
		context.log(`(spamfilter) Classification: ${classification}, score: ${score}`);
		context.log(`(spamfilter) Reasons: ${reasons?.join(', ') || '-'}`);
		context.set('spamfilter-classification', classification);
		context.set('spamfilter-score', score);
		if (classification === 'BAD') {
			context.spam = true;
			if (this.options.rejectSpam) {
				context.terminate = true;
			}
		}
	}
}

async function makeRequest(
	url: string,
	body: unknown,
	timeout: number = 10000,
	retry: boolean = true
) {
	const controller = new AbortController();
	const tm = setTimeout(() => {
		controller.abort();
	}, timeout);
	const delay = async () => await new Promise((r) => setTimeout(r, 1000));
	let resp: Response | null = null;
	try {
		resp = await fetch(url, {
			body: JSON.stringify(body),
			method: 'POST',
			headers: {
				...SPAM_FILTER_HEADERS,
				'content-type': 'application/json'
			},
			signal: controller.signal
		});
	} catch (err) {
		console.error(err);
		if (retry) {
			await delay();
			return makeRequest(url, body, timeout, false);
		}
		throw err;
	}
	clearTimeout(tm);
	if (resp?.status && resp.status >= 500 && retry) {
		await delay();
		return makeRequest(url, body, timeout, false);
	}
	if (resp?.status && resp.status !== 200) {
		throw new Error('Unexpected server response ' + resp.status);
	}
	return resp?.json() || null;
}
