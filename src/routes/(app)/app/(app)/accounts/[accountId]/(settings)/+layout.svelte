<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Head from '$lib/components/Head.svelte';
	import { formatTimeAgo } from '$lib/format';
	import type { LayoutData } from './$types';
	import Page from '$lib/components/Page.svelte';

	export let data: LayoutData;

	$: account = data.account;
</script>

<svelte:head>
	<title>{$_('label.settings')} | ALTCHA Forms</title>
</svelte:head>

<Head
	baseUrl="/app/accounts/{account.id}"
	tabs={[
		{
			href: '/settings',
			label: $_('label.settings')
		},
		{
			href: '/users',
			label: $_('label.users')
		},
		{
			href: '/api_keys',
			label: $_('label.api_keys')
		},
		{
			href: '/encryption_keys',
			label: $_('label.encryption_keys')
		},
		{
			href: '/usage',
			label: $_('label.usage')
		},
		{
			href: '/billing',
			label: $_('label.billing')
		},
		{
			href: '/delete_account',
			label: $_('label.delete_account')
		}
	]}
>
	<ul slot="breadcrumbs">
		<li>
			<a href="/app/accounts">{$_('label.accounts')}</a>
		</li>
		<li>
			<span>{account.name}</span>
		</li>
	</ul>

	<div class="flex items-end gap-3 mb-1">
		<div class="text-2xl font-bold">{account.name}</div>
	</div>

	<div class="flex flex-wrap gap-x-2 text-xs lg:text-sm opacity-60">
		<span class="w-full lg:w-auto">{$_('label.id')}: {account.id}</span>
		<span class="hidden lg:inline">&bull;</span>
		<span class="w-full lg:w-auto"
			>{$_('label.created_ago', { values: { ago: formatTimeAgo(account.createdAt) } })}</span
		>
	</div>
</Head>

<Page>
	<slot />
</Page>
