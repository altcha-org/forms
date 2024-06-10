<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import { parseInputOptions } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let disabled: boolean = false;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let value: string | null | undefined = block.default;
	export let visible: boolean = true;

	$: options = parseInputOptions(block.options?.options || []);
	$: value === void 0 ? (value = block.default) : void 0;
</script>

<BaseInput {block} {error} {value} on:change>
	<select
		class="select select-bordered shadow-sm {value === void 0 ? 'text-base-content/50' : ''}"
		name={block.name}
		disabled={disabled || block.readonly}
		required={visible && !preview && block.required}
		bind:value
	>
		{#if block.placeholder}
			<option value={void 0} disabled selected>{block.placeholder}</option>
		{/if}

		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if block.readonly}
		<input type="hidden" name={block.name} {value} />
	{/if}
</BaseInput>
