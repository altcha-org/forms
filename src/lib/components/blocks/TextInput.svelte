<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let autocomplete: string | undefined = void 0;
	export let block: IFormBlockPartial;
	export let disabled: boolean = false;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let transform:
		| ((value: string | null | undefined) => string | null | undefined)
		| undefined = void 0;
	export let value: string | null | undefined = block.default;
	export let visible: boolean = true;

	$: maxLength = block.options?.maxLength;
	$: length = value?.length || 0;
	$: value === void 0 ? (value = block.default) : void 0;

	function onChange() {
		if (transform) {
			value = transform(value);
		}
	}
</script>

<BaseInput hideAside={!maxLength} {block} {error} {value} on:change>
	<input
		type="text"
		name={block.name}
		{autocomplete}
		{disabled}
		placeholder={block.placeholder}
		maxlength={maxLength}
		readonly={block.readonly}
		required={visible && !preview && block.required}
		class="input input-bordered shadow-sm"
		bind:value
		on:change={onChange}
	/>

	<svelte:fragment slot="aside">
		{#if maxLength}
			<span class="text-xs whitespace-nowrap">{length} / {maxLength}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
