<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatNumber } from '$lib/format';
	import colors from '$lib/consts/colors';
	import type { IBarChartItem } from '$lib/types';

	export let items: IBarChartItem[] | Record<string, number>;
	export let maxRows: number = 0;

	const barColors = [...colors].reverse();

	let rows = maxRows;

	$: itemsArr = Array.isArray(items)
		? items
		: Object.entries(items).map(([label, value]) => ({ label, value: [value] }));
	$: sum = itemsArr.reduce((acc, item) => acc + arrSum(item.value), 0);
	$: renderItems = itemsArr
		.map((item) => {
			const value = item.value[0];
			return {
				percent: value ? Math.round((value / sum) * 1000) / 10 : 0,
				label: item.label,
				value
			};
		})
		.sort((a, b) => (a.value > b.value ? -1 : 1))
		.map((item, i) => {
			return {
				...item,
				color: barColors[i % barColors.length]
			};
		});
	$: slicedItems = renderItems.slice(0, rows > 0 ? rows : renderItems.length);
	$: hasMore = slicedItems.length < renderItems.length;

	function arrSum(numbers: number[]) {
		return numbers.reduce((acc, n) => acc + n, 0);
	}
</script>

<div class="flex flex-col gap-3">
	{#if renderItems.length === 0}
		<div class="italic opacity-60">
			{$_('text.no_records')}
		</div>
	{/if}

	{#each slicedItems as item}
		<div class="flex flex-col gap-1">
			<div class="flex gap-3 text-sm">
				<div class="grow truncate">
					<div class="max-w-sm truncate" title={item.label}>{item.label}</div>
				</div>
				<div class="whitespace-nowrap">
					<span>{formatNumber(item.value)}</span>
					<span class="opacity-20">|</span>
					<span class="opacity-60">{item.percent} %</span>
				</div>
			</div>
			<div class="overflow-hidden bg-primary/5">
				<div
					class="h-2 border-r border-base-100"
					style="background-color:{item.color};width:{item.percent}%"
				></div>
			</div>
		</div>
	{/each}

	{#if hasMore}
		<div>
			<button type="button" class="link text-sm" on:click={() => (rows += maxRows)}
				>{$_('button.show_more')} ({renderItems.length - slicedItems.length})</button
			>
		</div>
	{/if}
</div>
