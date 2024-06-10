<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Head from '$lib/components/Head.svelte';
	import { formatTimeAgo } from '$lib/format';
	import type { LayoutData } from './$types';
	import Page from '$lib/components/Page.svelte';

	export let data: LayoutData;

	$: user = data.user!;
</script>

<Head
	baseUrl="/app/profile"
	tabs={[
		{
			href: '/settings',
			label: $_('label.settings')
		},
		{
			href: '/encryption_keys',
			label: $_('label.encryption_keys')
		},
		{
			href: '/devices',
			label: $_('label.devices')
		},
		{
			href: '/passkeys',
			label: $_('label.passkeys')
		},
		{
			href: '/delete',
			label: $_('label.delete_user')
		}
	]}
>
	<ul slot="breadcrumbs">
		<li>
			<span>{$_('label.profile')}</span>
		</li>
	</ul>

	<div class="flex items-end gap-3 mb-1">
		<div class="text-2xl font-bold">{user.name}</div>
	</div>
	<div class="text-sm opacity-60">
		<span>{$_('label.created')}: {formatTimeAgo(user.createdAt)}</span>
	</div>
</Head>

<Page>
	<slot />
</Page>
