import { formMiddleware } from '../shared';
import { Type as t } from '@sinclair/typebox';
import { formsService } from '$lib/server/services/forms.service';
import { actionHandler } from '$lib/server/handlers';
import { license } from '$lib/server/license';
import { EFormStatus, type ILabel } from '$lib/types';
import { ValidationError } from '$lib/server/errors';
import type { Actions } from './$types';

export const actions = {
	publishForm: actionHandler(async (event) => {
		const { form } = await formMiddleware(event);
		if (form.status !== 'published') {
			await formsService.updateForm(event.params.formId, {
				status: 'published'
			});
			await formsService.trackUpdateEvent(event, form, {
				status: 'published'
			});
		}
	}),

	updateForm: actionHandler(
		async (event, data) => {
			const { form } = await formMiddleware(event);
			const labels: ILabel[] | undefined = data.labels ? JSON.parse(data.labels) : void 0;
			if (labels !== void 0 && labels !== null && !Array.isArray(labels)) {
				throw new ValidationError();
			}
			const updateData = {
				badges: data.badges?.split(',').filter((s) => !!s),
				confetti: data.confetti,
				displayBlocks: data.displayBlocks?.split(',').filter((s) => !!s),
				footer: data.footer,
				hidePoweredBy: license.valid ? data.hidePoweredBy : false,
				labels: labels?.filter(({ label }) => !!label)?.slice(0, 20),
				locale: data.locale,
				mode: data.mode as 'standard' | 'guided' | 'hidden',
				name: data.name,
				status: data.status,
				submitLabel: data.submitLabel,
				success: data.success,
				successRedirect: data.successRedirect
			};
			await formsService.updateForm(event.params.formId, updateData);
			await formsService.trackUpdateEvent(event, form, updateData);
		},
		{
			body: t.Object({
				badges: t.String(),
				confetti: t.Optional(t.Boolean()),
				displayBlocks: t.Optional(t.String()),
				footer: t.String(),
				hidePoweredBy: t.Boolean({
					default: false
				}),
				labels: t.Optional(t.String()),
				locale: t.Optional(t.String()),
				mode: t.String(),
				name: t.String({
					minLength: 1
				}),
				status: t.Enum(EFormStatus),
				submitLabel: t.String(),
				success: t.Optional(t.String()),
				successRedirect: t.Union([
					t.Null(),
					t.String({
						format: 'uri'
					})
				])
			})
		}
	)
} satisfies Actions;
