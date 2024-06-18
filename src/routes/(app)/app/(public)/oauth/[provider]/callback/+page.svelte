<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getDeviceName, getTimeZone } from '$lib/helpers';
	import Form from '$lib/components/Form.svelte';

	let form: Form;

	onMount(() => {
		form?.requestSubmit();
	});
</script>

<Form
	bind:this={form}
	data={{
		code: $page.url.searchParams.get('code'),
		deviceName: getDeviceName(),
		deviceTimezone: getTimeZone()
	}}
	successToast={false}
	let:error
>
	{#if error}
		<div class="flex flex-col gap-3 items-center">
			<div>{$_('text.oauth_failed')}</div>
			<div class="text-sm opacity-60">{error.error}</div>
			<div>
				<a href="/app/authentication" class="btn btn-sm btn-primary">{$_('button.authenticate')}</a>
			</div>
		</div>
	{:else}
		<div>
			<span class="loading loading-spinner loading-sm"></span>
		</div>
	{/if}
</Form>
