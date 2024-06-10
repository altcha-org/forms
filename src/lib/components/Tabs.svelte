<script lang="ts">
	import { page } from '$app/stores';
	import type { ITab } from '$lib/types';

	export let baseUrl: string = '';
	export let tabs: ITab[];
	export let value: string | undefined = void 0;
	export let activeIndex: number =
		value !== void 0 ? tabs.findIndex((tab) => tab.value === value) : 0;

	$: onPageUrlChange($page.url);
	$: onTabChange(activeIndex);

	function onPageUrlChange(_: typeof $page.url) {
		const idx = tabs.findIndex(
			({ href }) => href && $page.url.pathname.endsWith(baseUrl + href?.replace(/\/$/, ''))
		);
		if (idx >= 0 && activeIndex !== idx) {
			activeIndex = idx;
		}
	}

	function onTabChange(_: typeof activeIndex) {
		if (tabs[activeIndex]?.value !== void 0) {
			value = tabs[activeIndex].value;
		} else if (value !== void 0) {
			value = void 0;
		}
	}
</script>

<div
	role="tablist"
	class="tabs tracking-wide tabs-bordered inline-flex gap-6 max-w-full overflow-x-auto snap-x hide-scrollbar px-3 {$$restProps.class ||
		''}"
>
	{#each tabs as tab, i}
		{@const isActive = i === activeIndex}
		{#if !tab.hidden}
			{#if tab.href}
				<a
					role="tab"
					href={baseUrl + tab.href}
					class="tab px-0 gap-2"
					class:tab-active={isActive}
					class:disabled={tab.disabled}
				>
					{#if tab.icon}
						<svelte:component this={tab.icon} class="w-4 h-4"></svelte:component>
					{/if}
					<span class="max-w-[10rem] truncate">{tab.label}</span>
					{#if tab.badge}
						{#await tab.badge then badge}
							{#if badge === true}
								<span class="badge badge-xs rounded-full badge-{tab.badgeColor || 'ghost'}"></span>
							{:else if badge}
								<span class="badge badge-sm badge-{tab.badgeColor || 'ghost'}">{badge}</span>
							{/if}
						{/await}
					{/if}
				</a>
			{:else}
				<button
					type="button"
					role="tab"
					class="tab px-0 gap-2"
					class:tab-active={isActive}
					disabled={tab.disabled}
					on:click|preventDefault={() => (activeIndex = i)}
				>
					{#if tab.icon}
						<svelte:component this={tab.icon} class="w-4 h-4"></svelte:component>
					{/if}
					<span class="max-w-[10rem] truncate">{tab.label}</span>
					{#if tab.badge}
						{#await tab.badge then badge}
							{#if badge === true}
								<span class="badge badge-xs rounded-full badge-{tab.badgeColor || 'ghost'}"></span>
							{:else if badge}
								<span class="badge badge-sm badge-{tab.badgeColor || 'ghost'}">{badge}</span>
							{/if}
						{/await}
					{/if}
				</button>
			{/if}
		{/if}
	{/each}

	<slot />
</div>
