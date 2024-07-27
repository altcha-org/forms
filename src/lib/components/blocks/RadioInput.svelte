<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import { parseInputOptions } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		inline?: boolean;
		maxItems?: string | number;
		options?: string | string[] | { disabled?: boolean; label: string; value: string | null }[];
	}>;
	export let disabled: boolean = false;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | null | undefined = block.default;
	export let visible: boolean = true;

	$: options = parseInputOptions(block.options?.options, preview ? ['...'] : []);
	$: inline = block.options?.inline === true;
	$: maxItems = parseInt(String(block.options?.maxItems || '0'), 10) || 0;
	$: length = value?.length || 0;
	$: canAddMore = !maxItems || length < maxItems;
</script>

<BaseInput {block} {error} {value} on:change>
	<div class="flex flex-wrap gap-2" class:flex-col={!inline}>
		{#each options as option}
			<div>
				<label class="bg-base-200 rounded-md p-2 pr-3 inline-flex gap-3 items-start">
					<input
						type="radio"
						class="radio radio-sm bg-base-100"
						name={block.name}
						value={option.value}
						disabled={disabled ||
							(option.value !== null && !value?.includes(option.value) && !canAddMore)}
						readonly={readonly || block.readonly}
						required={visible && !preview && block.required}
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
			<span class="text-xs whitespace-nowrap">{length} / {maxItems}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
