<script lang="ts">
  import { formatNumber } from '$lib/format';
	import type { IBarChartItem } from '$lib/types';

  export let items: IBarChartItem[] | Record<string, number>;

  $: itemsArr = (Array.isArray(items) ? items : Object.entries(items).map(([ label, value ]) => ({ label, value })));
  $: sum = itemsArr.reduce((acc, item) => acc + item.value, 0);
  $: renderItems = itemsArr.map((item) => {
    return {
      ...item,
      percent: item.value ? (Math.round((item.value / sum) * 1000) / 10) : 0,
    };
  });
</script>

<div class="flex justify-between h-16 group">
  {#each renderItems as item}
  <div class="flex items-end bg-base-300/70 w-2 rounded-full tooltip tooltip-bottom transition-all hover:bg-base-300 hover:scale-105" data-tip="{item.label} - {formatNumber(item.value)}">
    <div class="grow bg-primary rounded-full" style="height:{item.percent}%"></div>
  </div>
  {/each}
</div>