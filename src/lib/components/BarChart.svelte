<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { formatNumber } from '$lib/format';
	import type { IBarChartItem } from '$lib/types';

  export let items: IBarChartItem[] | Record<string, number>;

	const colors = [
		'#f87171',
		'#f97316',
		'#facc15',
		'#bef264',
		'#86efac',
		'#5eead4',
		'#7dd3fc',
		'#c084fc',
		'#f9a8d4'
	];

  $: itemsArr = (Array.isArray(items) ? items : Object.entries(items).map(([ label, value ]) => ({ label, value })));
  $: sum = itemsArr.reduce((acc, item) => acc + item.value, 0);
  $: renderItems = itemsArr.map((item) => {
    return {
      ...item,
      percent: item.value ? (Math.round((item.value / sum) * 1000) / 10) : 0,
    };
  }).sort((a, b) => a.value > b.value ? -1 : 1).map((item, i) => {
    return {
      ...item,
      color: colors[i % colors.length],
    };
  });
</script>

<div class="flex flex-col gap-3">
  {#if renderItems.length === 0}
  <div class="italic opacity-60">
    {$_('text.no_records')}
  </div>
  {/if}

  {#each renderItems as item}
  <div class="flex flex-col gap-1">
    <div class="flex gap-3 text-sm">
      <div class="grow truncate">
        <div class="max-w-xs truncate">{item.label}</div>
      </div>
      <div>
        <span>{formatNumber(item.value)}</span>
        <span class="opacity-20">|</span>
        <span class="opacity-60">{item.percent} %</span>
      </div>
    </div>
    <div class="bg-base-300/70 rounded-full overflow-hidden">
      <div class="rounded-full h-2" style="background-color:{item.color};width:{item.percent}%"></div>
    </div>
  </div>
  {/each}
</div>