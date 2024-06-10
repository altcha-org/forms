<script lang="ts">
	import { _ } from 'svelte-i18n';
	import GdprBadge from '$lib/components/badges/GdprBadge.svelte';
	import CcpaBadge from '$lib/components/badges/CcpaBadge.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import AltchaIcon from '$lib/components/icons/Altcha.svelte';
	import MoonIcon from '$lib/components/icons/Moon.svelte';
	import SunIcon from '$lib/components/icons/Sun.svelte';
	import { darkTheme } from '$lib/stores';
	import type { IForm } from '$lib/types';

	export let form: IForm;
	export let preview: boolean = false;
	export let hidePoweredBy: boolean = false;

	$: badges = form.badges || [];

	function getBadgeCmp(name: string) {
		switch (name) {
			case 'ccpa':
				return CcpaBadge;
			case 'gdpr':
				return GdprBadge;
		}
	}
</script>

<div class="xl:px-6">
	<div class="flex flex-wrap justify-end xl:flex-nowrap gap-6 max-w-4xl mx-auto py-6">
		{#if !hidePoweredBy && !preview}
			<div class="grow flex justify-start">
				<a
					href="https://altcha.org/forms?ref=form"
					target="_blank"
					class="flex items-center justify-center gap-3 xl:fixed right-8 bottom-8 xl:mb-0 xl:border border-base-content/20 bg-base-100 p-2 xl:shadow-sm rounded-md text-sm group"
				>
					<AltchaIcon
						class="w-5 h-5 transition-transform duration-500 group-hover:rotate-[360deg]"
					/>
					<div class="opacity-70 group-hover:opacity-100">{$_('text.made_with_altcha')}</div>
				</a>
			</div>
		{/if}

		{#if form.footer}
			<div class="grow flex flex-col gap-3 text-sm">
				<div class="prose text-sm">
					<MarkdownRenderer value={form.footer} />
				</div>
			</div>
		{/if}

		<div class="flex items-center gap-6">
			{#if badges.length}
				<div class="grow flex flex-wrap gap-2 justify-end w-full">
					{#each badges as badge}
						{@const cmp = getBadgeCmp(badge)}
						{#if cmp}
							<div class="h-10">
								<svelte:component this={cmp} class="w-full h-full" />
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			<div class="xl:fixed top-8 right-8">
				<label class="swap swap-rotate">
					<input type="checkbox" value="dark" bind:checked={$darkTheme} />
					<SunIcon class="w-5 h-5 swap-on" />
					<MoonIcon class="w-5 h-5 swap-off" />
				</label>
			</div>
		</div>
	</div>
</div>
