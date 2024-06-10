import { BaseProcessor } from '$lib/server/processors/base.processor';
import { responsesService } from '../services/responses.service';
import type { ProcessorContext } from '$lib/server/services/forms.service';
import type { TResponseData } from '$lib/types';

export class StoreProcessor extends BaseProcessor<{
	retention: number;
}> {
	async run(ctx: ProcessorContext, _data: TResponseData): Promise<void> {
		ctx.store = true;
		ctx.retention = +this.options.retention || 0;
		ctx.responseId = responsesService.generateId();
	}
}
