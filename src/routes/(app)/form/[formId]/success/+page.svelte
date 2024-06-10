<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import confetti from 'canvas-confetti';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import ExternalIcon from '$lib/components/icons/External.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { shortenFormId } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	$: form = data.form;
	$: referrer = getReferrer($page.url.searchParams.get('ref'));
	$: backUrl = referrer || (form.mode === 'hidden' ? null : `/form/${shortenFormId(form.id)}`);
	$: hidePoweredBy = form.hidePoweredBy && data.licenseValid;

	onMount(async () => {
		if (browser && form.confetti) {
			confetti({
				particleCount: 100,
				spread: 80,
				origin: { y: 0.7 }
			});
		}
	});

	function getReferrer(ref?: string | null) {
		if (ref) {
			try {
				return atob(ref);
			} catch {
				// noop
			}
		}
		return null;
	}
</script>

<div class="flex flex-col items-center gap-6 my-12">
	<div>
		<div class="w-14 h-14 rounded-full flex justify-center items-center bg-success/10">
			<CheckIcon class="w-8 h-8 text-success" />
		</div>
	</div>

	<div class="max-w-md text-center prose text-base-content text-lg mb-12">
		<MarkdownRenderer value={form.success || $_('text.form_submitted')} />
	</div>

	{#if !hidePoweredBy}
		<div class="text-center">
			<div class="prose text-sm">
				<MarkdownRenderer value={$_('text.form_created_with')} />
			</div>
			<div class="flex items-center justify-center gap-8 mt-3">
				<a href="https://altcha.org/forms" class="btn btn-sm gap-2">
					<span>{$_('button.create_your_own_form')}</span>
					<ExternalIcon class="w-3 h-3" />
				</a>
				{#if backUrl}
					<a href={backUrl} class="text-sm link">{$_('button.go_back')}</a>
				{/if}
			</div>
		</div>
	{:else if backUrl}
		<div>
			<a href={backUrl} class="text-sm link">{$_('button.go_back')}</a>
		</div>
	{/if}
</div>
