<script lang="ts">
	import { _, json } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';

	export let auto: boolean = false;
	export let challengeurl: string;
	export let floating: boolean = false;
	export let hideBranding: boolean = false;

	let el: HTMLElement;

	$: strings = JSON.stringify($json('altcha'));

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

<div
	bind:this={el}
	class="rounded-md"
	class:shadow-sm={!floating}
>
	<altcha-widget
		auto={auto ? 'onload' : void 0}
		{challengeurl}
		delay={1500}
		hidefooter={hideBranding === true ? true : void 0}
		{strings}
		{floating}
		debug
		name="altcha"
		style="--altcha-max-width:{floating ? '260px' : '100%'};--altcha-color-base:oklch(var(--b1));--altcha-color-border:oklch(var(--bc) / 0.3);--altcha-border-radius:0.375rem"
	/>
</div>
