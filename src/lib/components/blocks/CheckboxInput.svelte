<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import AsteriskIcon from '$lib/components/icons/Asterisk.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | undefined = void 0;
	export let checked: boolean = value === 'true' || block.default === 'true';
	export let visible: boolean = true;

	$: label = block.label || block.name;
	$: onCheckedChange(checked);

	function onCheckedChange(_: typeof checked) {
		value = String(checked);
	}
</script>

<BaseInput hideLabel {block} {error} value={String(value)} on:change>
	<label class="inline-flex gap-3 items-center">
		<input
			type="checkbox"
			name={block.name}
			aria-label={label}
			data-group-label={block.label || block.name}
			required={visible && !preview && block.required}
			readonly={readonly || block.readonly}
			class="checkbox shadow-sm bg-base-100"
			value="true"
			bind:checked
			on:click={(ev) => (block.readonly ? ev.preventDefault() : void 0)}
		/>

		{#if !checked}
			<input type="hidden" name={block.name} value="false" />
		{/if}

		{#if label}
			<span class="label-text inline-flex gap-1">
				<span>{label}</span>
				{#if block.required}
					<AsteriskIcon class="w-3 h-3 text-error" />
				{/if}
			</span>
		{/if}
	</label>
</BaseInput>
