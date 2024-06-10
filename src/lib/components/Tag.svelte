<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CloseIcon from '$lib/components/icons/Close.svelte';

	export let removable: boolean = false;
	export let value: string;

	const dispatch = createEventDispatcher();
</script>

<div
	class="inline-flex gap-2 items-center bg-base-200 rounded-md p-1 px-3 pr-8 xl:pr-3 whitespace-nowrap max-w-[14rem] overflow-hidden relative group/tag"
	title={value}
>
	<span class="truncate">{value}</span>
	{#if removable}
		<div class="bg-base-200 absolute top-1 right-1 xl:opacity-0 group-hover/tag:opacity-100">
			<button
				type="button"
				class="btn btn-xs btn-circle bg-base-content/20"
				on:click|preventDefault={() => dispatch('remove')}
			>
				<CloseIcon class="w-4 h-4" />
			</button>
		</div>
	{/if}
</div>
