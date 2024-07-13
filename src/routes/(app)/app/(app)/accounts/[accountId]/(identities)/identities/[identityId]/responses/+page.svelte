<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import ResponseListItem from '$lib/components/ResponseListItem.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: groupedResponses = data.responses.reduce(
		(acc, response) => {
			const row = acc.find(({ form }) => form.id === response.formId);
			if (row) {
				row.responses.push(response);
			} else {
				const form = data.forms.find(({ id }) => response.formId === id);
				if (form) {
					acc.push({
						form,
						responses: [response]
					});
				}
			}
			return acc;
		},
		[] as { form: (typeof data.forms)[number]; responses: (typeof data.responses)[number][] }[]
	);
	$: hasMore = data.totalResponses > data.offset + data.limit;
</script>

<div>
	{$_('label.items_found')}: {data.totalResponses}
</div>

<div class="border border-base-300 rounded-md mt-[-1px] py-2">
	<div class="opacity-60 px-5 pb-2">
		<span class="text-sm">{$_('label.responses')}</span>
	</div>

	{#if data.responses.length === 0}
		<div class="opacity-60 italic px-5 py-3">
			{$_('text.no_responses')}
		</div>
	{/if}

	{#each groupedResponses as { form, responses }}
		<div class="flex px-5 py-2 bg-base-200/50">
			<div class="grow">
				<a href={`/app/forms/${form.id}/inbox`}>
					<span class="text-sm font-bold max-w-72 truncate">{form.name}</span>
				</a>
			</div>
		</div>

		{#each responses as response, i}
			<ResponseListItem {form} {response} on:click={() => goto(`/app/responses/${response.id}`)}
			></ResponseListItem>
			{#if i < responses.length - 1}
				<div class="border-b border-base-300"></div>
			{/if}
		{/each}
	{/each}
</div>

<div>
	<a href="?offset={data.offset + data.limit}" class="btn btn-sm" class:disabled={!hasMore}
		>{$_('button.load_more')}</a
	>
</div>
