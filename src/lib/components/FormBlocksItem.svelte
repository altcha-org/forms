<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import BLOCKS from '$lib/consts/blocks';
	import DropdownMenu from './DropdownMenu.svelte';
	import AsteriskIcon from '$lib/components/icons/Asterisk.svelte';
	import DraggableIcon from '$lib/components/icons/Draggable.svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import EditIcon from '$lib/components/icons/Edit.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import type { IFormBlock } from '$lib/types';

	export let block: IFormBlock;
	export let idx: number;

	const dispatch = createEventDispatcher();

	$: blockIcon = BLOCKS.find(({ type }) => type === block.type)?.icon;
	$: isContent = block.type.endsWith('Content');

	function onDragHandleMouseDown(ev: MouseEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget.closest('[data-block-idx]')?.setAttribute('draggable', 'true');
	}

	function onDragHandleMouseUp(ev: MouseEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget.closest('[data-block-idx]')?.setAttribute('draggable', 'false');
	}

	function onDragStart(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget!.style.opacity = '0.4';
		ev.dataTransfer!.effectAllowed = 'move';
		ev.dataTransfer!.setData('text/plain', ev.currentTarget.getAttribute('data-block-idx') || '');
	}

	function onDragEnd(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget!.style.opacity = '1';
		ev.currentTarget.setAttribute('draggable', 'false');
	}

	function onDragEnter(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget.classList.add('dd-over');
	}

	function onDragLeave(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget.classList.remove('dd-over');
	}

	function onDragOver(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.preventDefault();
		ev.currentTarget.classList.add('dd-over');
	}

	function onDrop(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.stopPropagation();
		ev.currentTarget.classList.remove('dd-over');
		const sourceId = ev.dataTransfer?.getData('text/plain') || '';
		if (sourceId && sourceId !== String(idx)) {
			dispatch('movebefore', { idx: +sourceId });
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="bg-base-100 flex gap-5 items-center p-1 rounded group"
	data-block-idx={idx}
	on:dragend={onDragEnd}
	on:dragstart={onDragStart}
	on:dragover={onDragOver}
	on:dragenter={onDragEnter}
	on:dragleave={onDragLeave}
	on:drop={onDrop}
>
	<!-- svelte-ignore a11y-interactive-supports-focus -->
	<div
		role="button"
		class="opacity-60 cursor-move"
		data-drag-handle="true"
		on:mousedown={onDragHandleMouseDown}
		on:mouseup={onDragHandleMouseUp}
	>
		<DraggableIcon class="w-6 h-6" />
	</div>

	<div>
		<div class="w-5 h-5 opacity-60">
			{@html blockIcon}
		</div>
	</div>

	<div class="flex-1">
		{#if !isContent}
			<div class="flex gap-1 font-bold">
				<span>{block.label || block.name}</span>
				{#if block.required}
					<AsteriskIcon class="w-3 h-3 text-error" />
				{/if}
			</div>
			<div class="text-sm opacity-60">{$_('block.' + block.type)}</div>
		{:else}
			<div class="opacity-60">{$_('block.' + block.type)}</div>
		{/if}
	</div>

	<div class="flex gap-1 items-center">
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-sm btn-square btn-ghost">
				<MoreHorizontalIcon class="w-4 h-4" />
			</div>
			<DropdownMenu autoclose>
				<ul class="menu gap-1">
					<li class="menu-title">{$_('label.actions')}</li>
					<li>
						<button
							type="button"
							class="flex grow justify-start items-center gap-3"
							on:click|preventDefault={() => dispatch('edit')}
						>
							<span class="grow text-left">{$_('button.edit')}</span>
							<EditIcon class="w-4 h-4" />
						</button>
					</li>
					<li>
						<button
							type="button"
							class="flex grow justify-start items-center gap-3"
							on:click|preventDefault={() => dispatch('remove')}
						>
							<span class="grow text-left">{$_('button.remove')}</span>
							<DeleteBackIcon class="w-4 h-4" />
						</button>
					</li>
				</ul>
			</DropdownMenu>
		</div>
	</div>
</div>
