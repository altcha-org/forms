import { formMiddleware } from '../shared';
import { Type as t } from '@sinclair/typebox';
import { actionHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import type { Actions } from './$types';
import { ValidationError } from '$lib/server/errors';
import type { IForm, IFormStep } from '$lib/types';

export const actions = {
	updateForm: actionHandler(
		async (event, data) => {
			const { form } = await formMiddleware(event);
			const steps = JSON.parse(data.steps);
			if (!Array.isArray(steps)) {
				throw new ValidationError();
			}
			steps.forEach((step: IFormStep) => {
				if (!step.text) {
					delete step.text;
				}
			});
			const updateData: Partial<IForm> = {
				banner: data.banner,
				logo: data.logo,
				steps
			};
			if (form.displayBlocks.length === 0 && steps[0]?.blocks[0]?.name) {
				updateData.displayBlocks = [steps[0].blocks[0].name];
			}
			await formsService.updateForm(form.id, updateData);
			await formsService.trackUpdateEvent(event, form, updateData);
		},
		{
			body: t.Object({
				banner: t.Optional(t.String()),
				logo: t.Optional(t.String()),
				steps: t.String()
			})
		}
	)
} satisfies Actions;
