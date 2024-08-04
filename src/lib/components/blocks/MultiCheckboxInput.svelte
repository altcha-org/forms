<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import { parseInputOptions } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		inline?: boolean;
		options?: string | string[] | { disabled?: boolean; label: string; value: string | null }[];
		maxItems?: string | number;
	}>;
	export let readonly: boolean = false;
	export let value: string | undefined = void 0;
	export let selected: string[] = parseValue(value || block.default);

	$: options = parseInputOptions(block.options?.options, ['...']);
	$: inline = block.options?.inline === true;
	$: maxItems = parseInt(String(block.options?.maxItems || '0'), 10);
	$: length = value?.length || 0;
	$: canAddMore = !maxItems || length < maxItems;
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

<BaseInput {block} value={String(value)} on:change>
	<input type="hidden" name={block.name} {value} />

	<div class="flex flex-wrap gap-2" class:flex-col={!inline}>
		{#each options as option}
			<div>
				<label class="bg-base-200 rounded-md p-2 pr-3 inline-flex gap-3 items-start">
					<input
						type="checkbox"
						class="checkbox checkbox-sm bg-base-100"
						value={option.value}
						aria-label={option.label}
						data-group-label={block.label || block.name}
						disabled={option.disabled ||
							(option.value !== null && !value?.includes(option.value) && !canAddMore)}
						readonly={readonly || block.readonly}
						bind:group={selected}
						on:click={(ev) => (block.readonly ? ev.preventDefault() : void 0)}
					/>

					<span class="label-text inline-flex gap-1">
						<span>{option.label}</span>
					</span>
				</label>
			</div>
		{/each}
	</div>

	<svelte:fragment slot="aside">
		{#if maxItems}
			<span class="text-xs whitespace-nowrap">{selected.length} / {maxItems}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
