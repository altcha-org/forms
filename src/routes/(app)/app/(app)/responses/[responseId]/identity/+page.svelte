<script lang="ts">
	import { _ } from 'svelte-i18n';
	import List from '$lib/components/List.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: identity = data.identity;
</script>

<List
	items={[
		[$_('label.id'), identity?.id],
		[$_('label.external_id'), identity?.externalId],
	]}
/>

{#if identity}
<div class="flex gap-3">
	<div>
		<a href="/app/accounts/{data.account.id}/identities/{identity.id}" class="btn btn-sm">{$_('button.view_identity')}</a>
	</div>

	{#if data.totalResponses}
	<div>
		<a href="/app/accounts/{data.account.id}/identities/{identity.id}/responses" class="btn btn-sm">{$_('button.view_related_responses', { values: { count: data.totalResponses } })}</a>
	</div>
	{/if}
</div>
{/if}
