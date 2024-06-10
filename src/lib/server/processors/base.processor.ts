import type { ProcessorContext } from '$lib/server/services/forms.service';
import type { TResponseData } from '$lib/types';

export abstract class BaseProcessor<Options = any> {
	constructor(readonly options: Options) {}
	abstract run(ctx: ProcessorContext, data: TResponseData): Promise<void>;
}
