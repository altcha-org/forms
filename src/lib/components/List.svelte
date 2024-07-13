<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';

	type T = $$Generic;

	export let items: T[] = [];

	const dispatch = createEventDispatcher();

	function onDblClick(idx: number, item: T) {
		dispatch('dblclick', {
			idx,
			item
		});
	}
</script>

<div class="border border-base-300 rounded-md" class:border-dashed={items.length === 0}>
	{#if items.length === 0}
		<div class="p-2 lg:p-4">
			<slot name="no_items">
				<div class="italic opacity-60">{$_('text.no_records')}</div>
			</slot>
		</div>
	{/if}

	{#each items as item, i}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex p-2 lg:p-4 focus-within:outline outline-primary"
			on:dblclick|preventDefault={() => onDblClick(i, item)}
		>
			<div class="grow w-full">
				<slot {item} index={i}>
					{#if Array.isArray(item)}
						<div class="text-sm opacity-60">{item[0]}</div>
						<div class="overflow-auto w-full">{item[1] || '—'}</div>
					{/if}
				</slot>
			</div>

			{#if $$slots.actions}
				<div>
					<slot name="actions" {item} index={i} />
				</div>
			{/if}
		</div>

		{#if i < items.length - 1}
			<div class="border-b border-base-300"></div>
		{/if}
	{/each}

	<slot name="end"></slot>
</div>
