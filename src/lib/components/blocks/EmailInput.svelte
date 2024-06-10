<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let autocomplete: string | undefined = void 0;
	export let block: IFormBlockPartial;
	export let disabled: boolean = false;
	export let error: string | null | undefined = void 0;
	export let preview: boolean = false;
	export let value: string | null | undefined = block.default;
	export let visible: boolean = true;

	$: value === void 0 ? (value = block.default) : void 0;
</script>

<BaseInput {block} {error} {value} on:change>
	<input
		type="email"
		name={block.name}
		placeholder={block.placeholder}
		required={visible && !preview && block.required}
		readonly={block.readonly}
		{autocomplete}
		{disabled}
		class="input input-bordered shadow-sm"
		bind:value
		on:click
	/>
</BaseInput>
