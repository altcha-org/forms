<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import FileRenderer from '$lib/components/FileRenderer.svelte';
	import AsteriskIcon from '$lib/components/icons/Asterisk.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import RatingInput from './blocks/RatingInput.svelte';
	import { copyToClipboard, stringifyBlockValue } from '$lib/helpers';
	import type { IFileWithoutAccount, IFormBlock } from '$lib/types';

	export let block: IFormBlock;
	export let files: Promise<IFileWithoutAccount[]>;
	export let value: any;

	const disptach = createEventDispatcher();
</script>

<div class="flex">
	<div class="grow">
		<div class="flex gap-1">
			<span class="text-sm opacity-60">{block.label || block.name}</span>
			{#if block?.required}
				<AsteriskIcon class="w-2 h-2 text-error" />
			{/if}
		</div>
		<div class="whitespace-pre-wrap">
			{#if ['FileInput', 'ImageInput', 'SignatureInput', 'PdfInput'].includes(block.type)}
				{@const fileIds =
					String(value || '')
						.split(',')
						.filter((p) => !!p) || []}
				<div class="flex flex-col gap-2 mt-2 pr-4">
					{#await files}
						<div>...</div>
					{:then _files}
						{#if fileIds.length === 0}
							<div>&mdash;</div>
						{:else if _files?.length}
							{#each fileIds as fileId}
								{@const file = _files.find(({ id }) => id === fileId)}
								{#if file}
									<FileRenderer {file} signature={['SignatureInput'].includes(block.type)} />
								{:else}
									<span>{fileIds} {file}</span>
								{/if}
							{/each}
						{/if}
					{/await}
				</div>
			{:else if block.type === 'RatingInput'}
				<div class="flex items-center gap-6 mt-1">
					<div class="grow">
						{#if value === void 0}
							<span>&mdash;</span>
						{:else}
							<RatingInput
								block={{
									...block,
									label: ''
								}}
								disabled
								{value}
							/>
						{/if}
					</div>
				</div>
			{:else}
				{stringifyBlockValue(value)}
			{/if}
		</div>
	</div>

	<div>
		<div class="dropdown dropdown-end dropdown-bottom pt-1.5">
			<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
				<MoreHorizontalIcon class="w-4 h-4" />
			</div>
			<DropdownMenu autoclose>
				<ul class="menu gap-1">
					<li class="menu-title">{$_('label.actions')}</li>
					<li>
						<button type="button" on:click|preventDefault={() => copyToClipboard(value)}
							>{$_('button.copy_to_clipboard')}</button
						>
					</li>
					<li>
						<button type="button" on:click|preventDefault={() => disptach('edit', { block, value })}
							>{$_('button.edit')}</button
						>
					</li>
				</ul>
			</DropdownMenu>
		</div>
	</div>
</div>
