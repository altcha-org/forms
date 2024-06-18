<script lang="ts">
	import { _ } from 'svelte-i18n';
	import List from '$lib/components/List.svelte';
	import { formatDateTime } from '$lib/format';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<List
  items={[
    [$_('label.id'), data.identity.id],
    [$_('label.external_id'), data.identity.externalId],
    [$_('label.last_used_at'), formatDateTime(data.identity.lastUsedAt)],
  ]}
/>

<div class="flex flex-col gap-3">
  <p>{$_('text.identity_linked_to_responses', { values: { count: data.totalResponses }})}</p>
  
  <div>
    <a href="/app/accounts/{data.account.id}/identities/{data.identity.id}/responses" class="btn btn-sm">{$_('button.view_responses')}</a>
  </div>
</div>
