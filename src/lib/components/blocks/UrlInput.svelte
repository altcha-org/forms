<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let value: string | null | undefined = block.default;
	export let visible: boolean = true;

	$: value === void 0 ? (value = block.default) : void 0;
</script>

<BaseInput {block} {error} {value} on:change>
	<input
		type="url"
		name={block.name}
		placeholder={block.placeholder}
		readonly={block.readonly}
		required={visible && !preview && block.required}
		class="input input-bordered shadow-sm"
		bind:value
	/>
</BaseInput>
