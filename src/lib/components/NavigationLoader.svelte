<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let el: HTMLElement;
	let timeout: ReturnType<typeof setTimeout>;

	onDestroy(() => {
		if (timeout) {
			clearTimeout(timeout);
		}
	});

	onMount(() => {
		timeout = setTimeout(() => {
			if (el) {
				el.style.width = '100%';
			}
		}, 50);
	});
</script>

<div class="fixed top-0 left-0 right-0 z-50 bg-primary/30 p-0">
	<div bind:this={el} class="h-1 bg-base-100/20 w-0 transition-all duration-[3s]"></div>
</div>
