import { error } from '@sveltejs/kit';
import { normalizeFormId } from '$lib/helpers';
import { loadHandler } from '$lib/server/handlers';
import { license } from '$lib/server/license';
import { rateLimit } from '$lib/server/ratelimiter';
import { formsService } from '$lib/server/services/forms.service';
import type { LayoutServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		await rateLimit('L1', event);
		const form = await formsService.findForm(normalizeFormId(event.params.formId));
		if (!form) {
			return error(404);
		}
		if (
			!event.url.pathname.endsWith('/success') &&
			(form.status !== 'published' ||
				form.account.suspended ||
				form.account.plan?.featureForms === false)
		) {
			return error(403);
		}
		return {
			form,
			licenseValid: license.valid
		};
	},
	{
		authorization: false
	}
) satisfies LayoutServerLoad;
