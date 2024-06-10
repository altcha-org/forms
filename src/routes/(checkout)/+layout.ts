import { browser } from '$app/environment';
import { availableLocales } from '$lib/i18n';
import { locale, waitLocale } from 'svelte-i18n';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (browser) {
		const lang = window.navigator.language;
		if (availableLocales[lang as keyof typeof availableLocales]) {
			locale.set(lang);
		}
	}
	await waitLocale();
};
