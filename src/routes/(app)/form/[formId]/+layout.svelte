<script lang="ts">
	import { locale } from 'svelte-i18n';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	if (data.form.locale !== $locale) {
		$locale = data.form.locale;
	}
</script>

<div class="max-w-4xl mx-auto min-h-screen px-3">
	<slot />
</div>
