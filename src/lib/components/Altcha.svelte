<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	export let auto: boolean = false;
	export let challengeurl: string;

	let el: HTMLElement;

	$: strings = JSON.stringify($_('altcha'));

	onDestroy(() => {
		if (el) {
			el.innerHTML = '';
		}
	});

	onMount(() => {
		if (browser) {
			import('altcha');
		}
	});
</script>

<div bind:this={el} class="shadow-sm rounded-md">
	<altcha-widget
		auto={auto ? 'onload' : void 0}
		{challengeurl}
		{strings}
		debug
		name="altcha"
		style="--altcha-max-width:100%;--altcha-color-border:oklch(var(--bc) / 0.3);--altcha-border-radius:0.375rem"
	/>
</div>
