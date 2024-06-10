<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import Alert from '$lib/components/Alert.svelte';
	import type { IAccount } from '$lib/types';

	$: account = $page.data.account as IAccount | undefined;
</script>

<Alert variant="warning">
	{$_('text.limit_reached')}

	<svelte:fragment slot="actions">
		{#if account}
			<a href="/app/accounts/{account.id}/billing" class="link">{$_('button.upgrade')}</a>
		{/if}
	</svelte:fragment>
</Alert>
