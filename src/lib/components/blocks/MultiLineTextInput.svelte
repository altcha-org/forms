<script lang="ts">
	import { _ } from 'svelte-i18n';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import MarkdownIcon from '$lib/components/icons/Markdown.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		maxLength?: string | number;
		rows?: string | number;
	}>;
	export let error: string | undefined = void 0;
	export let markdown: boolean = false;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | null | undefined = block.default;
	export let visible: boolean = true;

	$: maxLength = block.options?.maxLength
		? parseInt(String(block.options?.maxLength || '0'), 10)
		: void 0;
	$: rows = parseInt(String(block.options?.rows || '0'), 10) || 3;
	$: length = value?.length || 0;
	$: value === void 0 ? (value = block.default) : void 0;
</script>

<BaseInput hideAside={!maxLength && !markdown} {block} {error} {value} on:change>
	<textarea
		{rows}
		maxlength={maxLength}
		name={block.name}
		placeholder={block.placeholder}
		readonly={readonly || block.readonly}
		required={visible && !preview && block.required}
		class="textarea textarea-bordered shadow-sm"
		bind:value
	></textarea>

	<svelte:fragment slot="aside">
		{#if maxLength}
			<span class="text-xs whitespace-nowrap">{length} / {maxLength}</span>
		{/if}
		{#if markdown}
			<div title="Markdown">
				<MarkdownIcon class="w-5 h-5 opacity-40" />
			</div>
		{/if}
		<slot name="aside" />
	</svelte:fragment>
</BaseInput>
