<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { formsSearch, responsesSearch } from '$lib/search';
	import { debounce } from '$lib/helpers';
	import { formatDateTime, formatTimeShort } from '$lib/format';
	import { ResponseStream } from '$lib/response-stream';
	import SearchIcon from '$lib/components/icons/Search.svelte';
	import NoteIcon from '$lib/components/icons/Note.svelte';
	import StarFillIcon from '$lib/components/icons/StarFill.svelte';
	import StringHighlight from '$lib/components/StringHighlight.svelte';
	import FormResponseCount from '$lib/components/FormResponseCount.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import type { IForm, IResponse, TResponseData } from '$lib/types';

	interface IResponseCount {
		count: number;
		id: string;
		spam: boolean | null;
		read: boolean | null;
	}

	export let loading: boolean = false;
	export let totalForms: number = 0;
	export let erroredResponses: number = 0;
	export let totalResponses: number = 0;

	const dispatch = createEventDispatcher();
	const _onTermChange = debounce(onTermChange, 250);

	let elInput: HTMLInputElement;
	let searchFormsResuls: Awaited<ReturnType<(typeof formsSearch)['search']>> | null = null;
	let searchResponsesResuls: Awaited<ReturnType<(typeof responsesSearch)['search']>> | null = null;
	let responseStream: ResponseStream | null = null;
	let term: string = '';

	$: account = $page.data.account;
	$: _onTermChange(term);

	onDestroy(() => {
		if (responseStream) {
			responseStream.controller.abort();
		}
	});

	onMount(async () => {
		if (elInput) {
			elInput.focus();
		}
		if (responsesSearch.size !== null && !responsesSearch.finalized) {
			formsSearch.reset();
			responsesSearch.reset();
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

	async function loadForms() {
		let offset = 0;
		let forms: IForm[] = [];
		loading = true;
		try {
			while (true) {
				const result = await makeFormsRequest(offset);
				if (result.forms.length) {
					forms = result.forms;
					for (const form of forms) {
						await indexForm(
							form,
							result.responseCount.filter(({ id }) => id === form.id)
						);
					}
					await onTermChange(term);
				}
				const hasMore = result.total > result.offset + result.limit;
				if (!hasMore) {
					formsSearch.finalized = true;
					break;
				}
				offset += result.limit;
			}
		} finally {
			loading = false;
		}
		return forms;
	}

	async function makeSearch() {
		const forms: IForm[] = await loadForms();
		loading = true;
		responseStream = new ResponseStream({
			accountId: account.id,
			onAfterIndex: async () => {
				await onTermChange(term);
			},
			onResponse: async (response, data, err) => {
				const form = forms.find(({ id }) => id === response.formId);
				if (form) {
					await indexResponse(form, response, data, err);
				}
			}
		});
		await responseStream.stream();
		loading = false;
	}

	async function makeFormsRequest(offset: number = 0): Promise<{
		offset: number;
		limit: number;
		total: number;
		forms: IForm[];
		responseCount: IResponseCount[];
	}> {
		const url = new URL(`/app/accounts/${account.id}/stream/forms`, location.origin);
		url.searchParams.set('offset', String(offset));
		const resp = await fetch(url, {
			method: 'GET'
		});
		return resp.json();
	}

	async function indexForm(
		form: IForm,
		countResponses: { count: number; id: string; spam: boolean | null; read: boolean | null }[]
	) {
		await formsSearch.put({
			createdAt: form.createdAt,
			id: form.id,
			name: form.name,
			receivedResponses: form.receivedResponses,
			countResponses
		});
		totalForms = formsSearch.size || 0;
	}

	async function indexResponse(
		form: IForm,
		response: IResponse & { notes: number },
		data: TResponseData | null,
		error?: unknown
	) {
		if (data === null || error) {
			erroredResponses += 1;
			return false;
		}
		const entries = Object.entries(data);
		const primaryField = excludeFileIds(data[form.displayBlocks[0]]);
		const secondaryField = excludeFileIds(data[form.displayBlocks[1]]);
		const { emailField, otherFields } = entries.reduce(
			(acc, [key, value]) => {
				if (value && String(value).includes('@')) {
					acc.emailField = value;
				} else if (
					value?.length > 2 &&
					key !== form.displayBlocks[0] &&
					key !== form.displayBlocks[1]
				) {
					acc.otherFields.push(excludeFileIds(value));
				}
				return acc;
			},
			{
				emailField: '',
				otherFields: []
			} as {
				emailField: string;
				otherFields: string[];
			}
		);
		await responsesSearch.put({
			createdAt: response.createdAt,
			emailField,
			flag: response.flag,
			formId: form.id,
			formName: form.name,
			id: response.id,
			otherFields: otherFields.join('\n'),
			notes: response.notes,
			primaryField,
			read: response.read,
			secondaryField
		});
		totalResponses = responsesSearch.size || 0;
		return true;
	}

	function excludeFileIds(value: unknown) {
		if (typeof value === 'string' && value.startsWith('file_')) {
			return '';
		}
		return String(value);
	}

	export function stopSearch() {
		if (loading) {
			responseStream?.controller.abort();
			loading = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2 sticky top-16 z-40 bg-base-100">
		<label class="input input-bordered shadow-sm flex items-center gap-4 w-full">
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
				{$_('text.response_stream_errors')}
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
							{$_('text.search_found_responses', {
								values: { count: searchResponsesResuls.count || 0 }
							})}
						</span>
					</div>
				</div>
				{#each searchResponsesResuls.hits as hit, i (hit.id)}
					<a
						href="/app/responses/{hit.id}/data"
						class="block border-base-300 px-4 py-2 hover:bg-primary/5 focus-within:outline outline-primary cursor-pointer"
						class:border-b={i < searchResponsesResuls.hits.length - 1}
						on:click={() => dispatch('click', { hit })}
						tabindex="0"
					>
						<div class="flex">
							<div class="grow">
								<span class="text-xs font-bold opacity-80">{hit.document.formName}</span>
							</div>

							<div class="shrink-0 flex gap-3">
								<div class="text-xs opacity-60">
									{formatTimeShort(hit.document.createdAt)}
								</div>
								{#if hit.document.notes > 0}
									<a href="/app/responses/{hit.id}/notes">
										<NoteIcon class="w-4 h-4 text-base-content/30" />
									</a>
								{/if}
							</div>
						</div>

						<div class="flex gap-1 items-center">
							{#if hit.document.flag}
								<StarFillIcon class="w-4 h-4 text-warning" />
							{/if}
							<div class="line-clamp-2" class:font-bold={!hit.document.read}>
								<StringHighlight
									value={hit.document.primaryField}
									highlights={Object.values(hit.positions.primaryField || {}).flat()}
								/>
							</div>
						</div>
						{#if hit.document.secondaryField}
							<div class="line-clamp-2 text-sm text-base-content/60">
								<StringHighlight
									value={hit.document.secondaryField}
									highlights={Object.values(hit.positions.secondaryField || {}).flat()}
								/>
							</div>
						{/if}
						{#if hit.document.emailField}
							<div class="text-sm text-base-content/60">
								<StringHighlight
									value={hit.document.emailField}
									highlights={Object.values(hit.positions.emailField || {}).flat()}
								/>
							</div>
						{/if}

						{#if Object.keys(hit.positions.otherFields).length}
							<div class="text-sm text-base-content/60 line-clamp-3">
								<StringHighlight
									value={hit.document.otherFields}
									highlights={Object.values(hit.positions.otherFields || {}).flat()}
								/>
							</div>
						{/if}
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
