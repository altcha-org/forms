<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import NavigationLoader from '$lib/components/NavigationLoader.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	let sessionTimeout: ReturnType<typeof setTimeout> | null = null;

	afterNavigate(() => {
		if (sessionTimeout) {
			clearTimeout(sessionTimeout);
			sessionTimeout = null;
		}
		const expires = document.cookie.match(/jwt_expires=(\d+)/)?.[1];
		if (expires) {
			sessionTimeout = setTimeout(
				async () => {
					const resp = await fetch('/app/me');
					if (resp.status !== 200) {
						goto('/app/authentication', {
							invalidateAll: true
						});
					}
				},
				Math.max(4000, +expires * 1000) + 1000
			);
		}
	});
</script>

<Navbar />

{#if $navigating}
	<NavigationLoader />
{/if}

<div class="min-h-[calc(100vh-4rem)]">
	<slot />
</div>

<Footer hideLicenseLink={data.hideLicenseLink} region={data.region} />
