<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import AltchaIcon from '$lib/components/icons/Altcha.svelte';
	import LanguageSelect from '$lib/components/LanguageSelect.svelte';
	import SunIcon from '$lib/components/icons/Sun.svelte';
	import MoonIcon from '$lib/components/icons/Moon.svelte';
	import LocationIcon from '$lib/components/icons/Location.svelte';
	import { darkTheme } from '$lib/stores';
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	export let hideLicenseLink: boolean = false;
	export let region: string | null = null;

	$: appVersion = $page.data.appVersion || '0.0.0';
	$: privacyPolicyUrl = $page.data.privacyPolicyUrl;
	$: termsOfServiceUrl = $page.data.termsOfServiceUrl;
</script>

<footer class="bg-base-200/50 py-6 lg:py-12">
	<div class="flex flex-wrap gap-6 max-w-4xl mx-auto px-3">
		<div class="grow flex flex-col gap-6 text-sm">
			<div class="flex gap-3 items-center">
				<div>
					<AltchaIcon class="w-6 h-6" />
				</div>
				<div class="flex gap-2 items-end">
					<div class="text-lg font-bold leading-4">ALTCHA Forms</div>
					<div class="text-xs leading-3">{appVersion}</div>
					{#if !hideLicenseLink}
						<div class="text-xs leading-3">
							<a href="/app/license" class="link">{$_('button.license')}</a>
						</div>
					{/if}
				</div>
			</div>

			<div class="max-w-md">
				<MarkdownRenderer value={$_('text.app_footer')} />
			</div>

			<div class="flex flex-wrap gap-3">
				<a href="https://altcha.org/" class="link" target="_blank">Website</a>
				<a href="https://altcha.org/docs/get-started/" class="link" target="_blank">Documentation</a
				>
				{#if termsOfServiceUrl}
					<a href={termsOfServiceUrl} class="link" target="_blank">Terms of Service</a>
				{/if}
				{#if privacyPolicyUrl}
					<a href={privacyPolicyUrl} class="link" target="_blank">Privacy Policy</a>
				{/if}
				<a href="https://github.com/altcha-org/altcha" class="link" target="_blank">GitHub</a>
			</div>
		</div>

		<div>
			<div class="flex items-center gap-3">
				{#if region}
					<div class="flex items-center gap-2">
						<LocationIcon class="w-4 h-4" />
						<span class="text-sm">{$_('region.' + region)}</span>
					</div>
				{/if}
				<div>
					<LanguageSelect />
				</div>

				<label class="swap swap-rotate btn btn-sm btn-circle btn-ghost">
					<input type="checkbox" value="dark" bind:checked={$darkTheme} />
					<SunIcon class="w-4 h-4 swap-on" />
					<MoonIcon class="w-4 h-4 swap-off" />
				</label>
			</div>
		</div>
	</div>
</footer>
