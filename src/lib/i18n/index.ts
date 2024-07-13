import { locale, init, register, waitLocale, t } from 'svelte-i18n';
import { get } from 'svelte/store';

const defaultLocale = 'en-GB';
const _t = get(t);

register('en-GB', () => import('./locales/en-GB.json'));
register('en-US', () => import('./locales/en-US.json'));
register('de', () => import('./locales/de.json'));
register('es', () => import('./locales/es.json'));
register('fr', () => import('./locales/fr.json'));
register('it', () => import('./locales/it.json'));
register('pt', () => import('./locales/pt.json'));

init({
	fallbackLocale: defaultLocale
});

export const availableLocales = {
	'en-GB': 'English (GB)',
	'en-US': 'English (US)',
	de: 'Deutsch',
	es: 'Español',
	fr: 'Français',
	it: 'Italiano',
	pt: 'Português'
};

export async function i18n(
	l: string = defaultLocale
): Promise<(key: string, params?: Parameters<typeof _t>[1]) => string> {
	if (get(locale) !== l) {
		await waitLocale(l);
	}
	return (key: string, params?: Parameters<typeof _t>[1]) => {
		if (get(locale) !== l) {
			locale.set(l);
		}
		return _t(key, params);
	};
}
