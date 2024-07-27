<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		max?: string | number;
		min?: string | number;
		step?: string | number;
		unit?: string;
	}>;
	export let readonly: boolean = false;
	export let value: string | undefined = block.default;
	export let number: number | null | undefined = value !== void 0 ? +value : null;

	$: max = block.options?.max;
	$: min = block.options?.min;
	$: step = block.options?.step;
	$: unit = block.options?.unit;
	$: onNumberChange(number);
	$: onValueChange(value);

	function onNumberChange(_: typeof number) {
		const newValue = typeof number === 'number' ? String(number) : void 0;
		if (newValue !== value) {
			value = newValue;
		}
	}

	function onValueChange(_: typeof value) {
		const newNumber = typeof value === 'string' && value ? +value : null;
		if (newNumber !== number) {
			number = newNumber;
		}
	}
</script>

<BaseInput {block} {value} on:change>
	<label class="input input-bordered shadow-sm flex items-center gap-2">
		<input
			type="number"
			placeholder={block.placeholder}
			readonly={readonly || block.readonly}
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
