<script lang="ts">
	import { formatNumber } from '$lib/format';
	import colors from '$lib/consts/colors';
	import type { IBarChartItem } from '$lib/types';

	export let legend: string[] = [];
	export let items: IBarChartItem[] | Record<string, number>;
	export let wide: boolean = false;

	const barColors = [...colors].reverse();

	let selectedItem: (typeof renderItems)[number] | null = null;

	$: itemsArr = Array.isArray(items)
		? items
		: Object.entries(items).map(([label, value]) => ({ label, value: [value] }));
	$: max = itemsArr.reduce((acc, item) => Math.max(acc, ...item.value), 0);
	$: renderItems = itemsArr.map((item) => {
		return {
			bars: item.value.map((value, i) => {
				return {
					color: barColors[i % barColors.length],
					height: value ? Math.round((value / max) * 1000) / 10 : 0,
					value
				};
			}),
			label: item.label
		};
	});

	function onSelect(item: (typeof renderItems)[number]) {
		selectedItem = item;
	}

	function onBlur() {
		selectedItem = null;
	}
</script>

<div class="flex justify-between h-16 group">
	{#each renderItems as item}
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div
			class="relative bg-primary/5 w-2 outline-offset-1 outline-primary focus:outline"
			class:lg:w-4={wide}
			tabindex="0"
			on:focus={() => onSelect(item)}
			on:blur={() => onBlur()}
		>
			{#each item.bars as bar}
				<div
					class="absolute left-0 bottom-0 right-0 border-t border-base-100"
					style="background-color:{bar.color};height:{bar.height}%"
				></div>
			{/each}
		</div>
	{/each}
</div>

{#if legend.length}
	<div class="flex gap-4">
		{#each legend as label, i}
			{@const color = barColors[i % barColors.length]}
			<div class="flex items-center gap-1">
				<div class="w-2 h-2" style="background-color:{color}"></div>
				<div class="text-xs">
					<span>{label}</span>
					{#if selectedItem}
						<span>({formatNumber(selectedItem.bars[i]?.value || 0)})</span>
					{/if}
				</div>
			</div>
		{/each}
		{#if selectedItem}
			<div class="opacity-60 text-xs">
				{selectedItem.label}
			</div>
		{/if}
	</div>
{/if}
