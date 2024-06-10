<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import AsteriskIcon from '$lib/components/icons/Asterisk.svelte';
	import ErrorIcon from '$lib/components/icons/Error.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let error: string | null | undefined = void 0;
	export let hideAside: boolean = false;
	export let hideLabel: boolean = false;
	export let value: any = void 0;

	const dispatch = createEventDispatcher();

	$: label = block.label === void 0 ? block.name : block.label;
	$: size = block.size || 'full';
	$: onValueChange(value);

	function onValueChange(_: typeof value) {
		dispatch('change', value);
	}
</script>

<div class="form-control relative group {$$restProps.class || ''}">
	{#if label && !hideLabel}
		<div class="label flex-col items-start gap-0">
			<div class="label-text inline-flex gap-1">
				{label?.startsWith('$_') ? $_(label.slice(2)) : label}
				{#if block.required}
					<AsteriskIcon class="w-3 h-3 text-error" />
				{/if}
			</div>
			{#if block.help}
				<div class="label-text-alt opacity-60 !pt-1">
					{#if block.help.startsWith('$_')}
						{$_(block.help.slice(2))}
					{:else}
						<MarkdownRenderer value={block.help} />
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	<div
		class="flex flex-col"
		class:max-w-[14rem]={size === 'xs'}
		class:max-w-xs={size === 'sm'}
		class:max-w-md={size === 'md'}
		class:max-w-full={size === 'full'}
	>
		<slot />
	</div>

	{#if ($$slots.aside && !hideAside) || (block.help && hideLabel) || error}
		<div class="label pb-0 gap-3 items-start">
			<span class="label-text-alt inline-flex gap-2 formatted !pt-1">
				{#if error}
					<div class="flex gap-2 text-error">
						<ErrorIcon class="w-4 h-4 shrink-0" />
						<div>
							<MarkdownRenderer value={error} />
						</div>
					</div>
				{/if}
				{#if block.help && hideLabel}
					<span class="opacity-60">
						{#if block.help.startsWith('$_')}
							{$_(block.help.slice(2))}
						{:else}
							<MarkdownRenderer value={block.help} />
						{/if}
					</span>
				{/if}
			</span>
			{#if !hideAside}
				<span class="label-text-alt">
					<slot name="aside" />
				</span>
			{/if}
		</div>
	{/if}
</div>
