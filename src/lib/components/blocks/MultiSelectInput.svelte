<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import { parseInputOptions } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let value: string[] = block.default?.split(',') || [];

	$: allowCustomOptions = block.options?.customOptions === true;
	$: options = parseInputOptions(block.options?.options || []);
	$: maxItems = block.options?.maxItems || 0;
	$: length = value?.length || 0;
</script>

<BaseInput {block} {value} on:change>
	<input type="hidden" name={block.name} {value} />

	<MultiSelect
		placeholder={block.placeholder}
		{allowCustomOptions}
		{maxItems}
		{options}
		bind:value
	/>

	<svelte:fragment slot="aside">
		{#if maxItems}
			<span class="text-xs whitespace-nowrap">{length} / {maxItems}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
