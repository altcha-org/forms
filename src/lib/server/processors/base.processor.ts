import { replaceVariables } from '$lib/helpers';
import type { ProcessorContext } from '$lib/server/services/forms.service';
import type { TResponseData } from '$lib/types';

export abstract class BaseProcessor<
	Options extends Record<string, unknown> = Record<string, unknown>
> {
	constructor(readonly options: Options) {}
	abstract run(ctx: ProcessorContext, data: TResponseData): Promise<void>;

	getOptions(ctx: ProcessorContext, data: TResponseData): Options {
		const vars = {
			account_id: ctx.form.accountId,
			context: Object.fromEntries(ctx.metadata),
			data,
			form_id: ctx.form.id,
			response_id: ctx.responseId
		};
		return Object.entries(this.options).reduce(
			(acc, [key, value]) => {
				acc[key] = value && typeof value === 'string' ? replaceVariables(value, vars) : value;
				return acc;
			},
			{} as Record<string, unknown>
		) as Options;
	}
}
