<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import AsteriskIcon from '$lib/components/icons/Asterisk.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let value: boolean = block.default === 'true';
	export let visible: boolean = true;

	$: label = block.label || block.name;
	$: value === void 0 ? (value = block.default === 'true') : void 0;
</script>

<BaseInput hideLabel {block} {error} {value} on:change>
	<label class="inline-flex gap-3 items-center">
		<input
			type="checkbox"
			name={block.name}
			required={visible && !preview && block.required}
			readonly={block.readonly}
			class="checkbox shadow-sm bg-base-100"
			value="true"
			bind:checked={value}
			on:click={(ev) => (block.readonly ? ev.preventDefault() : void 0)}
		/>

		{#if !value}
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
