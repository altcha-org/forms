<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { invalidateAll } from '$app/navigation';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeft.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRight.svelte';
	import ReloadIcon from '$lib/components/icons/Reload.svelte';

	export let limit: number;
	export let offset: number;
	export let total: number | Promise<number>;

	let reloading: boolean = false;
	let reloadTimeout: ReturnType<typeof setTimeout> | null = null;

	function onReload() {
		reloading = true;
		if (reloadTimeout) {
			clearTimeout(reloadTimeout);
		}
		reloadTimeout = setTimeout(() => {
			reloading = false;
		}, 500);
		invalidateAll();
	}
</script>

<div class="w-full lg:w-auto flex gap-3 items-center justify-end pb-1">
	{#await total then t}
		<div class="text-sm">
			{#if t}
				{$_('text.page_of', {
					values: {
						start: offset + 1,
						end: Math.min(t, offset + limit),
						total: t
					}
				})}
			{/if}
		</div>
	{/await}
	<div class="flex items-center gap-1">
		<div class="tooltip" data-tip={$_('tooltip.previous_page')}>
			<a
				href="?offset={offset - limit}"
				class="btn btn-circle btn-sm btn-ghost"
				class:disabled={offset === 0}
			>
				<ChevronLeftIcon class="w-5 h-5" />
			</a>
		</div>

		<div class="tooltip" data-tip={$_('tooltip.next_page')}>
			{#await total}
				<a
					href="?offset={offset + limit}"
					class="btn btn-circle btn-sm btn-ghost"
					class:disabled={true}
				>
					<ChevronRightIcon class="w-5 h-5" />
				</a>
			{:then t}
				<a
					href="?offset={offset + limit}"
					class="btn btn-circle btn-sm btn-ghost"
					class:disabled={offset + limit >= t}
				>
					<ChevronRightIcon class="w-5 h-5" />
				</a>
			{/await}
		</div>

		<div class="tooltip" data-tip={$_('tooltip.reload')}>
			<button type="button" class="btn btn-circle btn-sm btn-ghost" on:click={() => onReload()}>
				<ReloadIcon class="w-4 h-4 {reloading ? 'animate-spin' : ''}" />
			</button>
		</div>
	</div>
</div>
