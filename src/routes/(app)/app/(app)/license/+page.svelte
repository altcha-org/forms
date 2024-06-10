<script lang="ts">
	import { _ } from 'svelte-i18n';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import Page from '$lib/components/Page.svelte';
	import List from '$lib/components/List.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: licenseFields = data.license ? Object.entries(data.license) : null;
</script>

<Page title={$_('title.license')}>
	{#if data.license}
		<div class="flex items-center gap-3">
			{#if data.valid}
				<CheckIcon class="w-4 h-4 text-success" />
				<span>{$_('text.license_valid')}</span>
			{:else}
				<span class="text-error">{$_('text.license_invalid')}</span>
			{/if}
		</div>

		{#if licenseFields}
			<List items={licenseFields} />
		{/if}
	{:else}
		<div class="prose">
			<MarkdownRenderer value={$_('text.license_info')} />
		</div>
	{/if}
</Page>
