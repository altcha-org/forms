import { responseMiddleware } from '../shared.server';
import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import { filesService } from '$lib/server/services/files.service';
import { formsService } from '$lib/server/services/forms.service';
import { clone } from '$lib/helpers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ parent }) => {
	const { response } = await parent();
	const files = response.files.map(({ id }) => id);
	return {
		files: files.length ? filesService.findFilesBulk(files).catch(() => []) : Promise.resolve([])
	};
}) satisfies PageServerLoad;

export const actions = {
	delete: actionHandler(async (event) => {
		const { response } = await responseMiddleware(event);
		await responsesService.deleteResponses([response.id]);
		await responsesService.trackDeleteEvent(event, response);
	}),

	toggleLabel: actionHandler(
		async (event, data) => {
			const { response } = await responseMiddleware(event);
			let labels = response.labels || [];
			if (labels.includes(data.label)) {
				labels = labels.filter((l) => l !== data.label);
			} else {
				labels = [...labels, data.label];
			}
			await responsesService.updateResponse(response.id, {
				labels: labels.sort()
			});
		},
		{
			body: t.Object({
				label: t.String()
			})
		}
	),

	toggleStarred: actionHandler(async (event) => {
		const { response } = await responseMiddleware(event);
		await responsesService.flagResponses([response.id], {
			flag: !response.flag
		});
	}),

	toggleRead: actionHandler(async (event) => {
		const { response } = await responseMiddleware(event);
		await responsesService.flagResponses([response.id], {
			read: !response.read
		});
	}),

	toggleSpam: actionHandler(async (event) => {
		const { response } = await responseMiddleware(event);
		await responsesService.flagResponses([response.id], {
			spam: !response.spam
		});
	}),

	undelete: actionHandler(async (event, data) => {
		const { response } = await responseMiddleware(event);
		if (response?.deleted) {
			await responsesService.undeleteResponses([response.id]);
			await responsesService.trackUndeleteEvent(event, response);
		}
	}),

	updateField: actionHandler(
		async (event, data) => {
			const { response } = await responseMiddleware(event);
			const oldData = JSON.parse(data.formData);
			const newData = clone(oldData);
			if (data.value === oldData[data.name]) {
				// no change
				return;
			}
			let updateData = null;
			if (newData) {
				newData[data.name] = data.value;
			}
			if (response.form.account.encryptionEnabled) {
				updateData = await formsService.encryptFormData(response.form, newData);
			}
			if (!updateData) {
				updateData = {
					data: newData
				};
			}
			await responsesService.updateResponse(response.id, updateData, [
				{
					time: Date.now(),
					text: `User ${event.locals.user!.name} updated field "${data.name}"`
				}
			]);
			await responsesService.trackUpdateEvent(event, response, oldData, newData);
		},
		{
			body: t.Object({
				formData: t.String(),
				name: t.String(),
				value: t.String()
			})
		}
	)
} satisfies Actions;
