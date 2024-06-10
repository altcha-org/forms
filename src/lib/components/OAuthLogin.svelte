<script lang="ts">
	import { _ } from 'svelte-i18n';
	import GoogleIcon from '$lib/components/icons/Google.svelte';
	import GithubIcon from '$lib/components/icons/Github.svelte';

	export let providers: string[] = [];
</script>

<div class="flex flex-col gap-3">
	{#if providers.includes('google')}
		<a href="/app/oauth/google" data-sveltekit-preload-data="false" class="btn gap-4 w-full">
			<GoogleIcon class="2-6 h-6" />
			<span>{$_('button.log_in_with', { values: { provider: 'Google' } })}</span>
		</a>
	{/if}

	{#if providers.includes('github')}
		<a href="/app/oauth/github" data-sveltekit-preload-data="false" class="btn gap-4 w-full">
			<GithubIcon class="w-6 h-6" />
			<span>{$_('button.log_in_with', { values: { provider: 'GitHub' } })}</span>
		</a>
	{/if}
</div>
