<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import CloseIcon from '$lib/components/icons/Close.svelte';

	export let delayHide: number = 4000;
	export let delayShow: number = 200;
	export let error: boolean = false;
	export let show: boolean = false;

	const dispatch = createEventDispatcher();

	let timeout: ReturnType<typeof setTimeout>;
	let showDelayed: boolean = false;

	$: onShowChange(show);

	afterNavigate(() => {
		if (timeout) {
			clearTimeout(timeout);
		}
		showDelayed = show;
	});

	onDestroy(() => {
		if (timeout) {
			clearTimeout(timeout);
		}
	});

	function onShowChange(_: typeof show) {
		if (showDelayed !== show) {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(() => (showDelayed = show), show ? delayShow : delayHide);
		}
	}
</script>

{#if showDelayed}
	<div
		class="flex items-center bg-neutral text-neutral-content shadow-md px-12 h-16 sticky top-0 z-[60]"
		class:bg-error={error}
		class:text-error-content={error}
	>
		<div class="grow">
			<slot />
		</div>

		<div>
			<button
				type="button"
				class="btn btn-sm btn-circle btn-ghost"
				on:click|preventDefault={() => dispatch('close')}
			>
				<CloseIcon class="w-4 h-4" />
			</button>
		</div>
	</div>
{/if}
