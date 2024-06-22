<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { createEventDispatcher, onMount } from 'svelte';
	import { formsSearch, responsesSearch } from '$lib/search';
	import { debounce } from '$lib/helpers';
	import { decryptData } from '$lib/helpers';
	import { encryptionKeys } from '$lib/stores';
	import { formatDateTime, formatTimeShort } from '$lib/format';
	import SearchIcon from '$lib/components/icons/Search.svelte';
	import StringHighlight from '$lib/components/StringHighlight.svelte';
	import FormResponseCount from '$lib/components/FormResponseCount.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import type { IForm, IResponse } from '$lib/types';

	export let loading: boolean = false;
	export let totalForms: number = 0;
	export let erroredResponses: number = 0;
	export let totalResponses: number = 0;

	const dispatch = createEventDispatcher();
	const _onTermChange = debounce(onTermChange, 250);

	let elInput: HTMLInputElement;
	let searchFormsResuls: Awaited<ReturnType<(typeof formsSearch)['search']>> | null = null;
	let searchResponsesResuls: Awaited<ReturnType<(typeof responsesSearch)['search']>> | null = null;
  let searchStopped: boolean = false;
	let term: string = '';

	$: account = $page.data.account;
	$: _onTermChange(term);

	onMount(async () => {
		if (elInput) {
			elInput.focus();
		}
	});

	async function onTermChange(_: typeof term) {
		if (term) {
			if (formsSearch.size === null) {
				makeSearch();
			}
			const wasLoading = loading;
			if (!wasLoading) {
				loading = true;
			}
			searchFormsResuls = await formsSearch.search(term);
			searchResponsesResuls = await responsesSearch.search(term);
			if (!wasLoading && loading) {
				loading = false;
			}
		} else {
			searchResponsesResuls = null;
      searchFormsResuls = null;
		}
	}

	async function makeSearch() {
		let offset = 0;
		let forms: IForm[] = [];
		loading = true;
    erroredResponses = 0;
		try {
			while (true) {
        if (searchStopped) {
          break;
        }
				const result = await makeRequest(offset);
				if (result.forms.length) {
					forms = result.forms;
					for (const form of forms) {
						await indexForm(form, result.responseCount.filter(({ id }) => id === form.id));
					}
					_onTermChange(term);
				}
				for (const response of result.responses.results) {
          if (searchStopped) {
            break;
          }
					const form = forms.find(({ id }) => id === response.formId);
					if (form) {
						await indexResponse(form, response);
						_onTermChange(term);
					}
				}
				const hasMore = result.responses.total > result.responses.offset + result.responses.limit;
				if (!hasMore) {
					break;
				}
				offset += result.responses.limit;
			}
		} finally {
			loading = false;
      searchStopped = false;
		}
	}

	async function makeRequest(
		offset: number = 0,
		includeForms: boolean = offset === 0
	): Promise<{
		forms: IForm[];
		responseCount: { count: number; id: string; read: boolean | null; spam: boolean | null }[];
		responses: { results: IResponse[]; offset: number; limit: number; total: number };
	}> {
		const url = new URL(`/app/accounts/${account.id}/responses/search`, location.origin);
		url.searchParams.set('term', term);
		url.searchParams.set('includeForms', includeForms ? 'true' : 'false');
		url.searchParams.set('offset', String(offset));
		const resp = await fetch(url, {
			method: 'GET'
		});
		return resp.json();
	}

	async function indexForm(form: IForm, countResponses: { count: number; id: string; spam: boolean | null; read: boolean | null }[]) {
		await formsSearch.put({
			createdAt: form.createdAt,
			id: form.id,
			name: form.name,
      receivedResponses: form.receivedResponses,
      countResponses,
		});
		totalForms = formsSearch.size || 0;
	}

	async function indexResponse(form: IForm, response: IResponse) {
		let data: Record<string, any> = response.data || {};
		if (response.encrypted && response.dataEncrypted && response.encryptionKeyHash) {
			data = await decryptData(response.dataEncrypted, response.encryptionKeyHash, $encryptionKeys);
      if (data === null) {
        erroredResponses += 1;
        return false;
      }
		}
		const primaryField = data[form.displayBlocks[0]];
		const secondaryField = data[form.displayBlocks[1]];
		const email = Object.values(data).find((value: string) => value.includes('@'));
		await responsesSearch.put({
			createdAt: response.createdAt,
			email,
			id: response.id,
			otherFields: [],
			primaryField,
			secondaryField
		});
		totalResponses = responsesSearch.size || 0;
    return true;
	}

  export function stopSearch() {
    if (loading) {
      searchStopped = true;
      loading = false;
    }
  }
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<label class="input input-bordered flex items-center gap-4 w-full">
			{#if loading}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<SearchIcon class="w-4 h-4" />
			{/if}
			<input
				type="search"
				class="grow"
				placeholder={$_('placeholder.search')}
				bind:this={elInput}
				bind:value={term}
			/>
		</label>
	</div>

  {#if erroredResponses}
  <div>
    <Alert variant="warning">
      {$_('text.search_errors')}
    </Alert>
  </div>
  {/if}

  {#if searchFormsResuls}
    <div class="border border-base-300 rounded">
      {#if searchFormsResuls?.count}
        <div class="flex gap-3 px-4 py-2 bg-base-300/20">
          <div class="grow">
            <span class="text-sm opacity-60">
              {$_('text.search_found_forms', { values: { count: searchFormsResuls.count || 0 } })}
            </span>
          </div>
        </div>

        {#each searchFormsResuls.hits as hit, i (hit.id)}
          <a
            href="/app/forms/{hit.id}/inbox"
            class="block border-base-300 px-4 py-2 hover:bg-primary/5 focus-within:outline outline-primary cursor-pointer"
            class:border-b={i < searchFormsResuls.hits.length - 1}
            on:click={() => dispatch('click', { hit })}
            tabindex="0"
          >
            <div class="flex">
              <div class="grow font-bold">
                <StringHighlight
                  value={hit.document.name}
                  highlights={Object.values(hit.positions.name || {}).flat()}
                />
              </div>

              <div>
                <FormResponseCount
                  count={hit.document.countResponses}
                  formId={hit.id}
                  received={hit.document.receivedResponses}
                />
              </div>
            </div>
            <div class="text-sm opacity-60">
              {formatDateTime(hit.document.createdAt)}
            </div>
          </a>
        {/each}
      {/if}

      {#if searchResponsesResuls?.count}
        <div class="flex gap-3 px-4 py-2 bg-base-300/20">
          <div class="grow">
            <span class="text-sm opacity-60">
              {$_('text.search_found_responses', { values: { count: searchResponsesResuls.count || 0 } })}
            </span>
          </div>
        </div>
        {#each searchResponsesResuls.hits as hit, i (hit.id)}
          <a
            href="/app/responses/{hit.id}/data"
            class="flex border-base-300 px-4 py-2 hover:bg-primary/5 focus-within:outline outline-primary cursor-pointer"
            class:border-b={i < searchResponsesResuls.hits.length - 1}
            on:click={() => dispatch('click', { hit })}
            tabindex="0"
          >
            <div class="grow">
              <div class="font-bold">
                <StringHighlight
                  value={hit.document.primaryField}
                  highlights={Object.values(hit.positions.primaryField || {}).flat()}
                />
              </div>
              {#if hit.document.secondaryField}
                <div class="text-sm text-base-content/60">
                  <StringHighlight
                    value={hit.document.secondaryField}
                    highlights={Object.values(hit.positions.secondaryField || {}).flat()}
                  />
                </div>
              {/if}
              {#if hit.document.email}
                <div class="text-sm text-base-content/60">
                  <StringHighlight
                    value={hit.document.email}
                    highlights={Object.values(hit.positions.email || {}).flat()}
                  />
                </div>
              {/if}
            </div>
            <div class="text-xs opacity-60">
              {formatTimeShort(hit.document.createdAt)}
            </div>
          </a>
        {/each}
      {/if}

      {#if !searchFormsResuls?.count && !searchResponsesResuls?.count}
        <div class="italic opacity-60 text-sm px-4 py-2">
          {#if loading}
            {$_('text.searching')}
          {:else}
            {$_('text.no_results')}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
