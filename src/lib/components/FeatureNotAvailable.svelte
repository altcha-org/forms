<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { IAccount } from '$lib/types';

	export let account: Pick<IAccount, 'id'> | null = null;
</script>

<div class="flex gap-3 bg-warning/10 p-3 rounded-md mb-6 text-sm">
	<div class="grow">
		{$_('text.feature_unavailable_for_plan')}
	</div>

	{#if account}
		<div>
			<a href="/app/accounts/{account.id}/billing" class="link">{$_('button.upgrade')}</a>
		</div>
	{/if}
</div>
