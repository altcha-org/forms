<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		datetime?: boolean;
		max?: string;
		min?: string;
	}>;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | null = null;
	export let visible: boolean = true;

	let elInput: HTMLInputElement;

	$: datetime = !!block.options?.datetime;
	$: max = getDateValue(block.options?.max);
	$: min = getDateValue(block.options?.min);
	$: required = visible && !preview && block.required;
	$: value === null && block.default ? (value = getDateValue(block.default)) : void 0;

	function getDateValue(date: Date | string | null | undefined) {
		if (!date) {
			return null;
		}
		if (date === 'now') {
			if (datetime) {
				return toLocalISOString(new Date());
			}
			date = new Date();
		}
		return toLocalISOString(new Date(date)).split('T')[0];
	}

	function toLocalISOString(date: Date) {
		const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
		localDate.setSeconds(0);
		localDate.setMilliseconds(0);
		return localDate.toISOString().slice(0, -1);
	}
</script>

<BaseInput {block} {error} {value} on:change>
	{#if datetime}
		<input
			bind:this={elInput}
			type="datetime-local"
			name={block.name}
			placeholder={block.placeholder}
			readonly={readonly || block.readonly}
			class="input input-bordered shadow-sm"
			{max}
			{min}
			{required}
			bind:value
		/>
	{:else}
		<input
			bind:this={elInput}
			type="date"
			name={block.name}
			placeholder={block.placeholder}
			readonly={readonly || block.readonly}
			class="input input-bordered shadow-sm"
			{max}
			{min}
			{required}
			bind:value
		/>
	{/if}
</BaseInput>
