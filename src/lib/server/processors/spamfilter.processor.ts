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
		const resp = await fetch(env.SPAM_FILTER_URL, {
			body: JSON.stringify(body),
			method: 'POST',
			headers: {
				...SPAM_FILTER_HEADERS,
				'content-type': 'application/json'
			}
		});
		if (resp.status !== 200) {
			throw new Error('Unexpected server response ' + resp.status);
		}
		const json = await resp.json();
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
