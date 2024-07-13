<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { ResponseStream } from '$lib/response-stream';
	import BarChart from '$lib/components/BarChart.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import type { IFormBlockPartial, IResponse, TResponseData } from '$lib/types';
	import type { PageData } from './$types';
	import type { Writable } from 'svelte/store';
	import Alert from '$lib/components/Alert.svelte';

	export let data: PageData;

	const allResponses = getContext<Writable<boolean>>('allResponses');
	const safeTypes = [
		'CheckboxInput',
		'MultiCheckboxInput',
		'RadioInput',
		'MultiSelectInput',
		'ToggleInput',
		'RatingInput',
		'SelectInput'
	];

	let aggregations: Record<string, Record<string, number>> = {};
	let loading: boolean = false;
	let selectedBlocks: string[] = [];
	let stream: ResponseStream;
	let totalCount: number | null = null;
	let scannedCount: number = 0;
	let erroredCount: number = 0;

	$: end = $page.url.searchParams.get('end');
	$: start = $page.url.searchParams.get('start');
	$: blocks = data.form.steps.reduce((acc, step) => {
		for (const block of step.blocks) {
			acc.push(block);
		}
		return acc;
	}, [] as IFormBlockPartial[]);

	onMount(() => {
		requestAnimationFrame(() => {
			selectedBlocks = getSafeBlocks();
		});
	});

	function aggerateResponse(response: IResponse, responseData: TResponseData) {
		for (const name of selectedBlocks) {
			const block = blocks.find((b) => b.name === name);
			if (!aggregations[name]) {
				aggregations[name] = {};
			}
			let value = !responseData[name] ? '—' : String(responseData[name]);
			if (['CheckboxInput', 'ToggleInput'].includes(block?.type || '')) {
				value = value === 'true' ? $_('label.yes') : $_('label.no');
			}
			if (aggregations[name][value] === void 0) {
				aggregations[name][value] = 0;
			}
			aggregations[name][value] += 1;
		}
	}

	function getSafeBlocks() {
		return blocks.filter(({ type }) => type && safeTypes.includes(type)).map(({ name }) => name);
	}

	async function analyze() {
		aggregations = {};
		totalCount = null;
		scannedCount = 0;
		erroredCount = 0;
		loading = true;
		if (stream && !stream.controller.signal.aborted) {
			stream.controller.abort();
		}
		stream = new ResponseStream({
			accountId: data.account.id,
			dateEnd: end && !$allResponses ? new Date(end) : void 0,
			dateStart: start && !$allResponses ? new Date(start) : void 0,
			formId: data.form.id,
			onRequest(_, result) {
				totalCount = result.total;
			},
			onResponse(response, data, error) {
				if (!error && data) {
					aggerateResponse(response, data);
				} else if (error) {
					erroredCount += 1;
				}
				scannedCount += 1;
			}
		});
		await stream.stream();
		loading = false;
	}

	function stop() {
		stream.controller.abort();
	}
</script>

<div class="flex gap-6">
	<div class="w-64">
		<div class="flex flex-col gap-2 border border-base-300 rounded-lg p-3">
			<div class="mb-3">
				<div class="text-sm opacity-60">{$_('title.select_fields')}</div>
			</div>

			{#each blocks as block}
				<label class="flex items-start gap-2">
					<div class="pt-0.5">
						<input
							type="checkbox"
							class="checkbox checkbox-xs"
							value={block.name}
							bind:group={selectedBlocks}
						/>
					</div>
					<div class="truncate">
						<div class="truncate" class:font-bold={selectedBlocks.includes(block.name)}>
							{block.label || block.name}
						</div>
						<div class="truncate text-xs opacity-60">
							{$_('block.' + block.type)} ({block.name})
						</div>
					</div>
				</label>
			{/each}
		</div>
	</div>

	<div class="grow flex flex-col gap-6">
		<div class="flex items-center bg-base-200/50 p-3 rounded-lg">
			<div class="grow flex gap-2">
				<button
					type="button"
					class="btn btn-sm btn-primary"
					disabled={loading || selectedBlocks.length === 0}
					on:click={() => analyze()}
				>
					{#if loading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else}
						<span>{$_('button.analyze')}</span>
					{/if}
				</button>

				{#if loading}
					<button type="button" class="btn btn-sm btn-ghost" on:click|preventDefault={() => stop()}>
						<span>{$_('button.stop')}</span>
					</button>
				{/if}
			</div>

			<div>
				{#if totalCount !== null}
					<div class="bg-base-100 px-3 py-1 rounded-md text-sm">
						<span>{$_('text.x_responses', { values: { x: scannedCount } })}</span>
						<span class="opacity-20">/</span>
						<span class="opacity-60">{totalCount}</span>
					</div>
				{/if}
			</div>
		</div>

		{#if erroredCount}
			<div>
				<Alert variant="warning">
					{$_('text.response_stream_errors')}
				</Alert>
			</div>
		{/if}

		{#if selectedBlocks.length === 0}
			<div class="text-sm opacity-60 italic">
				<MarkdownRenderer value={$_('text.analytics_responses_select_fields')} />
			</div>
		{/if}

		{#each selectedBlocks as name}
			{@const block = blocks.find((block) => block.name === name)}
			{#if block}
				<div class="border border-base-300 rounded-lg p-3">
					<div class="border-b border-base-300 pb-3 mb-3">
						<div class="font-bold">{block.label || block.name}</div>
						<div class="truncate max-w-xs text-sm opacity-60">{block.name}</div>
					</div>
					<div>
						{#if aggregations[block.name]}
							<BarChart items={aggregations[block.name]} maxRows={10} />
						{:else}
							<div class="opacity-60 italic">
								{$_('text.no_records')}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>
