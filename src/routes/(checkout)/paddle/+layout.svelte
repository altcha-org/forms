<script lang="ts">
	import '../../../app.scss';
	import { _ } from 'svelte-i18n';
	import AltchaIcon from '$lib/components/icons/Altcha.svelte';
</script>

<div class="flex flex-col gap-6 max-w-4xl mx-auto p-3 xl:py-12">
	<div class="flex items-center gap-3">
		<AltchaIcon class="w-8 h-8" />
		<div class="font-bold text-lg">Altcha Forms</div>
	</div>

	<div>
		<a href="/app" class="text-sm opacity-60 hover:opacity-100">
			&larr; <span class="link">{$_('button.back')}</span>
		</a>
	</div>

	<div>
		<slot />
	</div>
</div>
