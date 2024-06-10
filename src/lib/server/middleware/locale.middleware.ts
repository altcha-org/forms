import { get } from 'svelte/store';
import { locales } from 'svelte-i18n';
import { i18n } from '$lib/i18n';
import type { RequestEvent } from '@sveltejs/kit';

const availableLocales = get(locales);

export default () => {
	return async (event: RequestEvent) => {
		event.locals.locale = 'en-GB';

		const lang = event.request.headers.get('accept-language')?.split(',')[0];
		if (lang && availableLocales.includes(lang)) {
			event.locals.locale = lang;
		}
		event.locals.i18n = await i18n(event.locals.locale);
	};
};
