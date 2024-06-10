<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import DraggableIcon from '$lib/components/icons/Draggable.svelte';

	export let index: number;

	const dispatch = createEventDispatcher();

	function onDragHandleMouseDown(ev: MouseEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget.closest('[data-sortable-index]')?.setAttribute('draggable', 'true');
	}

	function onDragHandleMouseUp(ev: MouseEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget.closest('[data-sortable-index]')?.setAttribute('draggable', 'false');
	}

	function onDragStart(ev: DragEvent & { currentTarget: HTMLElement }) {
		ev.currentTarget!.style.opacity = '0.4';
		ev.dataTransfer!.effectAllowed = 'move';
		ev.dataTransfer!.setData(
			'text/plain',
			ev.currentTarget.getAttribute('data-sortable-index') || ''
		);
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
		const sourceIdx = ev.dataTransfer?.getData('text/plain') || '';
		if (sourceIdx && sourceIdx !== String(index)) {
			dispatch('movebefore', { index: +sourceIdx });
		}
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="flex items-center gap-3 {$$restProps.class || ''}"
	data-sortable-index={index}
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

	<div class="grow">
		<slot />
	</div>
</div>
