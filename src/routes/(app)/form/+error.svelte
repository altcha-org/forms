<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';

	$: status = $page.status;
</script>

<div class="max-w-4xl mx-auto min-h-screen px-3">
	<div class="border rounded-xl my-12 p-5">
		{#if status === 404}
			<div class="text-lg font-bold">{$_('title.form_not_found')}</div>
			<div>
				<p>{$_('text.form_not_found')}</p>
			</div>
		{:else if status === 403}
			<div class="text-lg font-bold">{$_('title.form_not_available')}</div>
			<div>
				<p>{$_('text.form_not_available')}</p>
			</div>
		{:else}
			<div class="text-lg font-bold">{$_('title.unexpected_error')}</div>
			<div>
				<p>{$_('text.form_unexpected_error')}</p>
			</div>
		{/if}

		<div class="text-sm opacity-60 mt-6">
			Status: {status}
		</div>
	</div>
</div>
