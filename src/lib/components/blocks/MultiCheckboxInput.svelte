<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import { parseInputOptions } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let value: string[] = parseValue(block.default);

	$: options = parseInputOptions(block.options?.options, ['...']);
	$: inline = block.options?.inline === true;
	$: maxItems = block.options?.maxItems || 0;
	$: length = value?.length || 0;
	$: canAddMore = !maxItems || length < maxItems;
	$: value === void 0 ? (value = parseValue(block.default)) : void 0;
	$: onValueChange(value);

	function onValueChange(_: typeof value) {
		if (!Array.isArray(value)) {
			value = [];
		}
	}

	function parseValue(str: string | undefined) {
		return (
			str
				?.split(',')
				.map((p) => p.trim())
				.filter((p) => !!p) || []
		);
	}
</script>

<BaseInput {block} {value} on:change>
	<input type="hidden" name={block.name} {value} />

	<div class="flex flex-wrap gap-2" class:flex-col={!inline}>
		{#each options as option}
			<div>
				<label class="bg-base-200 rounded-md p-2 pr-3 inline-flex gap-3 items-start">
					<input
						type="checkbox"
						class="checkbox checkbox-sm bg-base-100"
						value={option.value}
						disabled={option.disabled || (!value?.includes(option.value) && !canAddMore)}
						readonly={block.readonly}
						bind:group={value}
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
			<span class="text-xs whitespace-nowrap">{value.length} / {maxItems}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
