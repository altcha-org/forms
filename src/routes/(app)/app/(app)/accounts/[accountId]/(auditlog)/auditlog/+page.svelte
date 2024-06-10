<script lang="ts">
	import { _ } from 'svelte-i18n';
	import AuditlogTable from '$lib/components/AuditlogTable.svelte';
	import Head from '$lib/components/Head.svelte';
	import Page from '$lib/components/Page.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: account = data.account;
	$: events = data.events;
</script>

<Head baseUrl="/app/accounts/{account.id}">
	<ul slot="breadcrumbs">
		<li>
			<a href="/app/accounts">{$_('label.accounts')}</a>
		</li>
		<li>
			<a href="/app/accounts">{account.name}</a>
		</li>
		<li>
			<span>{$_('label.auditlog')}</span>
		</li>
	</ul>

	<div class="flex items-end gap-3 mb-1">
		<div class="text-2xl font-bold">{$_('label.auditlog')}</div>
	</div>
</Head>

<Page>
	<AuditlogTable accountId={account.id} {events} pagination={data.pagination} />
</Page>
