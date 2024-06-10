import { createHash } from 'node:crypto';
import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { formsService } from '$lib/server/services/forms.service';
import { error } from '@sveltejs/kit';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '$lib/server/errors';
import { normalizeFormId } from '$lib/helpers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const { form } = await event.parent();
		if (form.mode === 'hidden') {
			return error(404);
		}
		return {
			encrypted: !!form.account?.encryptionEnabled,
			limitFileSize: form.account.plan?.limitFileSize || 10,
			passwordOk: !!event.cookies.get('form_password')
		};
	},
	{
		authorization: false
	}
) satisfies PageServerLoad;

export const actions = {
	submitPassword: actionHandler(
		async (event, data) => {
			const form = await formsService.findForm(normalizeFormId(event.params.formId));
			if (!form) {
				throw new NotFoundError();
			}
			if (form.status !== 'published') {
				throw new ForbiddenError();
			}
			if (!form.password || form.password !== data.form_password) {
				throw new UnauthorizedError();
			}
			event.cookies.set('form_password', createPasswordCookie(form.id, data.form_password), {
				path: event.url.pathname
			});
		},
		{
			authorization: false,
			body: t.Object({
				form_password: t.String({
					minLength: 1
				})
			})
		}
	)
} satisfies Actions;

function createPasswordCookie(formId: string, password: string) {
	return createHash('sha256').update([formId, password].join(';')).digest('hex');
}
