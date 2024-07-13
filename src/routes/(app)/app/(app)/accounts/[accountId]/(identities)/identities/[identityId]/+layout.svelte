<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Head from '$lib/components/Head.svelte';
	import Page from '$lib/components/Page.svelte';
	import { formatTimeAgo } from '$lib/format';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<Head
	baseUrl="/app/accounts/{data.account.id}/identities/{data.identity.id}"
	tabs={[
		{
			href: '/',
			label: $_('label.identity')
		},
		{
			href: '/metadata',
			label: $_('label.metadata')
		},
		{
			href: '/responses',
			label: $_('label.responses')
		},
		{
			href: '/delete',
			label: $_('label.delete')
		}
	]}
>
	<ul slot="breadcrumbs">
		<li>
			<a href="/app/accounts/{data.account.id}/identities">{$_('label.identities')}</a>
		</li>
	</ul>

	<div class="flex flex-wrap gap-2 mb-1">
		<div class="grow flex items-end gap-3 truncate">
			<div class="font-bold max-w-full truncate">
				{data.identity.externalId}
			</div>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
		<div class="flex items-center flex-wrap gap-x-2 text-xs lg:text-sm opacity-60">
			<span class="w-full lg:w-auto"
				>{$_('label.created_ago', {
					values: { ago: formatTimeAgo(data.identity.createdAt) }
				})}</span
			>
		</div>
	</div>
</Head>

<Page>
	<slot />
</Page>
