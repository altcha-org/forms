<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/stores';
	import Page from '$lib/components/Page.svelte';
	import SearchIcon from '$lib/components/icons/Search.svelte';
	import Form from '$lib/components/Form.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { formatTimeAgo } from '$lib/format';
	import type { IIdentity } from '$lib/types';
  import type { PageData } from './$types';

  export let data: PageData;

  onMount(() => {
    if ($page.url.searchParams.get('deleted') === '1') {
      requestAnimationFrame(() => {
        toast.success($_('notification.deleted'));
      });
    }
  });

  let searchResults: IIdentity[] | null = null;

  function onSearchResult(result: { result: { data: { identities: IIdentity[] }} }) {
    searchResults = result.result.data.identities || [];
  }
</script>

<Page title={$_('title.identities')}>

  <div class="prose max-w-full">
    <MarkdownRenderer
      value={$_('text.identities_info')}
    />
  </div>

  <div class="bg-base-200 p-4 rounded-lg">
    <div class="flex flex-col gap-3">
      <Form
        action="?/search"
        successToast={false}
        on:submit={(ev) => onSearchResult(ev.detail)}
      >
        <div class="flex gap-4">
          <label class="grow input input-bordered flex items-center gap-2">
            <input type="text" name="query" class="grow" placeholder={$_('placeholder.search')} />
            <SearchIcon class="w-4 h-4" />
          </label>

          <div>
            <button type="submit" class="btn btn-primary">{$_('button.search')}</button>
          </div>
        </div>
      </Form>

      <div class="text-sm opacity-60">
        {$_('help.identities_search')}
      </div>
    </div>
  </div>

  <div>
    <span>{$_('label.identities_total')}:</span>
    {#await data.totalIdentitiesPromise}
      <span>...</span>
    {:then count}
      <span>{count}</span>
    {/await}
  </div>

  {#if searchResults}
  <div class="flex flex-col gap-3 mt-6">
    <div class="text-xl">{$_('title.search_results')}</div>

    {#if searchResults.length === 0}
		<div class="italic opacity-60">
			{$_('text.no_records')}
		</div>
    {/if}

    {#each searchResults as identity}
    <div class="flex gap-4 border border-base-300 rounded-lg p-4">
      <div class="grow">
        <div class="font-bold">
          <a href="/app/accounts/{data.account.id}/identities/{identity.id}" class="link">{identity.externalId}</a>
        </div>
        <div class="text-sm opacity-60">
          <span>{$_('label.created_ago', { values: { ago: formatTimeAgo(identity.createdAt) } })}</span>
          <span>&bull;</span>
          <span>{identity.id}</span>
        </div>
      </div>
    </div>
    {/each}
  </div>
  {/if}
</Page>