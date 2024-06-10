import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { availableLocales } from '$lib/i18n';
import { locale, waitLocale } from 'svelte-i18n';
import { language } from '$lib/stores';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (browser) {
		const lang = get(language) || window.navigator.language;
		if (availableLocales[lang as keyof typeof availableLocales]) {
			locale.set(lang);
		}
	}
	await waitLocale();
};
