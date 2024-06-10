<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let value: number | null = block.default ? +block.default : null;

	$: max = block.options?.max;
	$: min = block.options?.min;
	$: step = block.options?.step;
	$: unit = block.options?.unit;
	$: value === null && block.default ? (value = +block.default) : void 0;
</script>

<BaseInput {block} {value} on:change>
	<label class="input input-bordered shadow-sm flex items-center gap-2">
		<input
			type="number"
			placeholder={block.placeholder}
			readonly={block.readonly}
			name={block.name}
			{min}
			{max}
			{step}
			class="grow"
			bind:value
		/>
		{#if unit}
			<span class="">{unit}</span>
		{/if}
	</label>
</BaseInput>
