<script>
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { darkTheme, device, uploadPromise } from '$lib/stores';
	import { Toaster, toast } from 'svelte-sonner';
	import UploadingToast from '$lib/components/toasts/Uploading.svelte';
	import '../../app.scss';

	$: $device = $page.data.user ? $page.data.device : null;

	darkTheme.subscribe(() => {
		onDarkThemeChange();
	});

	afterNavigate(() => {
		toast.dismiss();
	});

	uploadPromise.subscribe((promise) => {
		if (promise) {
			toast.promise(promise, {
				loading: UploadingToast,
				success: $_('text.upload_completed'),
				error: $_('text.upload_failed'),
				duration: 500
			});
		}
	});

	function onDarkThemeChange() {
		if (browser) {
			document.querySelector('html')?.setAttribute('data-theme', $darkTheme ? 'dark' : 'light');
		}
	}
</script>

<svelte:head>
	<title>ALTCHA Forms</title>
</svelte:head>

<slot />

<Toaster
	offset="20px"
	position="top-center"
	toastOptions={{
		style: '!text-base'
	}}
/>
