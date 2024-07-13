<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import DOMPurify from 'isomorphic-dompurify';
	import BLOCKS from '$lib/consts/blocks';
	import FormBlock from '$lib/components/blocks/FormBlock.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import StarFillIcon from '$lib/components/icons/StarFill.svelte';
	import type { IFormBlock } from '$lib/types';

	export let allowPremium: boolean = !!$page.data.account?.plan?.premium;

	let block: IFormBlock;
	let label: string = 'Field label';
	let type: string = 'TextInput';

	$: block = {
		name: '',
		label,
		options: {},
		required: true,
		type
	};
	$: inputBlocks = BLOCKS.filter(({ type }) => type.endsWith('Input'));
	$: layoutBlocks = BLOCKS.filter(({ type }) => !type.endsWith('Input'));

	function onSetBlockType(t: string) {
		type = t;
	}
</script>

<input type="hidden" name="type" value={type} />

<div class="flex flex-wrap gap-6">
	<div class="flex-1 flex flex-col gap-6">
		<div class="text-lg">{$_('label.block_type')}</div>

		{#if type.endsWith('Input')}
			<TextInput
				block={{
					label: $_('label.label'),
					help: $_('help.block_label'),
					name: 'label',
					type: 'TextInput'
				}}
				bind:value={label}
			/>
		{/if}

		<div class="flex flex-col gap-2">
			<div class="font-bold">{$_('label.block_type')}</div>

			<div class="max-h-80 overflow-auto bg-base-200/50 rounded-md p-4">
				<div class="text-lg opacity-60 mb-3">{$_('label.inputs')}</div>

				<div class="grid grid-cols-3 gap-3">
					{#each inputBlocks as inputBlock}
						{@const active = inputBlock.type === type}
						{@const allowed = allowPremium || !inputBlock.premium}
						<button
							type="button"
							class="flex flex-col items-center gap-2 bg-base-100 border-2 rounded-md p-2 relative"
							class:border-primary={active}
							on:click|preventDefault={() => (allowed ? onSetBlockType(inputBlock.type) : void 0)}
						>
							<div class="flex justify-center items-center">
								<div
									class="w-6 h-6"
									class:opacity-60={allowed && !active}
									class:opacity-20={!allowed}
								>
									<!-- eslint-disable svelte/no-at-html-tags -->
									{@html DOMPurify.sanitize(inputBlock.icon || '')}
								</div>
							</div>
							<div class="text-sm text-center" class:opacity-60={!allowed}>
								{$_('block.' + inputBlock.type)}
							</div>

							{#if !allowPremium && inputBlock.premium}
								<div class="absolute right-1 top-1" title={$_('label.premium_feature')}>
									<StarFillIcon class="w-4 h-4 text-warning" />
								</div>
							{/if}
						</button>
					{/each}
				</div>

				<div class="text-lg opacity-60 my-3">{$_('label.layout')}</div>

				<div class="grid grid-cols-3 gap-3">
					{#each layoutBlocks as layoutBlock}
						{@const active = layoutBlock.type === type}
						<button
							type="button"
							class="flex flex-col items-center gap-2 bg-base-100 border-2 rounded-md p-2 relative"
							class:border-primary={active}
							on:click|preventDefault={() => onSetBlockType(layoutBlock.type)}
						>
							<div class="flex-1 flex justify-center items-center">
								<div class="w-6 h-6">
									<!-- eslint-disable svelte/no-at-html-tags -->
									{@html DOMPurify.sanitize(layoutBlock.icon || '')}
								</div>
							</div>
							<div class="text-sm text-center">{$_('block.' + layoutBlock.type)}</div>

							{#if !allowPremium && layoutBlock.premium}
								<div class="absolute right-1 top-1" title={$_('label.premium_feature')}>
									<StarFillIcon class="w-4 h-4 text-warning" />
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-3 w-full lg:w-5/12 lg:border-l lg:pl-6">
		<div class="">
			<div class="text-lg mb-6">{$_('label.preview')}</div>

			<div class="border border-dashed border-base-300 p-3 rounded-md">
				<FormBlock {block} preview value={block.default} />
			</div>
		</div>

		<div class="text-sm opacity-60">
			<p>{$_('text.update_block_after_adding')}</p>
		</div>
	</div>
</div>
