import { formMiddleware } from '../shared';
import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import { encryptionKeysService } from '$lib/server/services/encryptionKeys.service';
import type { IForm } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async (event) => {
	const { account } = await event.parent();
	const encryptionKeys = await encryptionKeysService.listEncryptionKeysForAccount(account.id, true);
	return {
		encryptionKeys: encryptionKeys.map(({ hash }) => ({ hash }))
	};
}) satisfies PageServerLoad;

export const actions = {
	updateSecurity: actionHandler(
		async (event, data) => {
			const { form } = await formMiddleware(event);
			const updateData = {
				captcha: data.captcha,
				captchaAuto: data.captchaAuto,
				captchaComplexity: data.captchaComplexity as IForm['captchaComplexity'],
				captchaFloating: data.captchaFloating,
				captchaInvisible: data.captchaInvisible,
				contextInfo: data.contextInfo,
				encryptionKeyHash: data.encryptionKeyHash === '' ? null : data.encryptionKeyHash,
				password: data.password ? data.password : null
			};
			await formsService.updateForm(event.params.formId, updateData);
			await formsService.trackUpdateEvent(event, form, updateData);
		},
		{
			body: t.Object({
				captcha: t.Optional(t.Boolean()),
				captchaAuto: t.Optional(t.Boolean()),
				captchaComplexity: t.Optional(t.String()),
				captchaFloating: t.Optional(t.Boolean()),
				captchaInvisible: t.Optional(t.Boolean()),
				contextInfo: t.Optional(t.Boolean()),
				encryptionKeyHash: t.Optional(t.String()),
				password: t.Optional(t.String())
			})
		}
	)
} satisfies Actions;
