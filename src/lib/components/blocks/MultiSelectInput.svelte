<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import { parseInputOptions } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		customOptions?: boolean;
		maxItems?: string | number;
		options?: string | string[] | { disabled?: boolean; label: string; value: string | null }[];
	}>;
	export let readonly: boolean = false;
	export let value: string | undefined = void 0;
	export let selected: string[] = parseValue(value || block.default);

	$: allowCustomOptions = block.options?.customOptions === true;
	$: options = parseInputOptions(block.options?.options || []);
	$: maxItems = parseInt(String(block.options?.maxItems) || '0', 10);
	$: length = selected?.length || 0;
	$: onSelectedChange(selected);

	function onSelectedChange(_: typeof selected) {
		value = selected.join(',');
	}

	function parseValue(str: string | undefined) {
		return (
			str
				?.split(/(?<!\\),/)
				.map((p) => p.trim())
				.filter((p) => !!p) || []
		);
	}
</script>

<BaseInput {block} {value} on:change>
	<input type="hidden" name={block.name} {value} />

	<MultiSelect
		placeholder={block.placeholder}
		{allowCustomOptions}
		{maxItems}
		{options}
		{readonly}
		bind:value={selected}
	/>

	<svelte:fragment slot="aside">
		{#if maxItems}
			<span class="text-xs whitespace-nowrap">{length} / {maxItems}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
