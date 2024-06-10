<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Notification from '$lib/components/Notification.svelte';
	import AltchaIcon from '$lib/components/icons/Altcha.svelte';
	import LanguageSelect from '$lib/components/LanguageSelect.svelte';
	import RegionSelect from '$lib/components/RegionSelect.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: appVersion = $page.data.appVersion || '0.0.0';
	$: userDeleted = $page.url.searchParams.get('userDeleted') === 'true';
	$: privacyPolicyUrl = data.privacyPolicyUrl;
	$: termsOfServiceUrl = data.termsOfServiceUrl;
</script>

{#if userDeleted}
	<Notification on:close={() => goto($page.url.pathname)}>
		{$_('text.user_deleted')}
	</Notification>
{/if}

<div class="bg-base-200 flex flex-col gap-x-12 min-h-screen">
	<div class="flex gap-3 p-3 lg:px-12 lg:py-6">
		<div class="grow">
			<a href="/app" class="inline-flex gap-6 items-center">
				<AltchaIcon class="w-10 h-10" />

				<div class="tracking-wide">
					<div class="text-sm font-light leading-tight">ALTCHA</div>
					<div class="text-lg font-semibold leading-tight">Forms</div>
				</div>
			</a>
		</div>
	</div>

	<div class="grow flex justify-center md:items-center xl:pb-12">
		<slot />
	</div>

	<div class="flex flex-col gap-6 px-1 py-3 xl:py-12">
		<div class="flex flex-col md:flex-row gap-3 md:justify-center">
			{#if data.region}
				<RegionSelect availableRegions={data.availableRegions} region={data.region} />
			{/if}

			<LanguageSelect />
		</div>

		<div class="flex flex-col md:flex-row gap-4 md:justify-center text-sm opacity-70 px-4">
			<span>{appVersion}</span>

			{#if privacyPolicyUrl}
				<a href={privacyPolicyUrl} rel="privacy-policy" class="link" target="_blank"
					>{$_('label.privacy_policy')}</a
				>
			{/if}
			{#if termsOfServiceUrl}
				<a href={termsOfServiceUrl} rel="terms-of-service" class="link" target="_blank"
					>{$_('label.terms_of_service')}</a
				>
			{/if}
		</div>
	</div>
</div>
