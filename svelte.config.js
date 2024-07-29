// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx'],

	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		csp: {
			directives: {
				'script-src': ['self'],
				'worker-src': ['self', 'blob:'],
			},
			reportOnly: {
				'script-src': ['self'],
				'worker-src': ['self', 'blob:'],
				'report-uri': ['/_report/csp']
			}
		},
		csrf: {
			checkOrigin: false
		}
	}
};

export default config;
