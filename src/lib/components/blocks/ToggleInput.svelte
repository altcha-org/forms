<script lang="ts">
	import { _ } from 'svelte-i18n';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let disabled: boolean = false;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let value: boolean = block.default === 'true';
	export let visible: boolean = true;

	$: label = block.label || block.name;
	$: value === void 0 ? (value = block.default === 'true') : void 0;
</script>

<BaseInput hideLabel {block} {error} {value} on:change>
	<div>
		<label class="inline-flex gap-3 items-center">
			<input
				type="checkbox"
				name={block.name}
				readonly={block.readonly}
				required={visible && !preview && block.required}
				value="true"
				class="toggle toggle-primary"
				{disabled}
				bind:checked={value}
				on:click={(ev) => (block.readonly ? ev.preventDefault() : void 0)}
			/>
			{#if !value}
				<input type="hidden" name={block.name} value="false" />
			{/if}

			{#if label}
				<span class="label-text" class:opacity-60={disabled}>
					{label?.startsWith('$_') ? $_(label.slice(2)) : label}
				</span>
			{/if}
		</label>
	</div>
</BaseInput>
