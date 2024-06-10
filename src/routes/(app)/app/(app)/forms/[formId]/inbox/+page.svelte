<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto, invalidateAll } from '$app/navigation';
	import { debounce } from '$lib/helpers';
	import ResponseListItem from '$lib/components/ResponseListItem.svelte';
	import CheckboxIcon from '$lib/components/icons/Checkbox.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ResponseListBulkActions from '$lib/components/ResponseListBulkActions.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const _onVisibilityChange = debounce(() => {
		if (!document.hidden) {
			invalidateAll();
		}
	}, 5000);

	let selected: string[] = [];

	$: onFilterChange(data.filter);

	function onFilterChange(_: typeof data.filter) {
		selected = [];
	}

	function onSelectAll() {
		const checked = selected.length === data.responses.length;
		if (checked) {
			selected = [];
		} else {
			selected = data.responses.map(({ id }) => id);
		}
	}
</script>

<svelte:document on:visibilitychange={() => _onVisibilityChange()} />

<div class="flex flex-col">
	<div class="flex flex-wrap-reverse gap-y-3 justify-between">
		<div class="overflow-x-auto hide-scrollbar snap-x">
			<div role="tablist" class="tabs tabs-lifted max-w-full">
				<a
					href="?filter="
					role="tab"
					class="tab whitespace-nowrap flex-nowrap text-base gap-2 snap-start"
					class:tab-active={!data.filter}
				>
					<span class:opacity-60={data.filter}>{$_('label.recent')}</span>
				</a>
				<a
					href="?filter=unread"
					role="tab"
					class="tab whitespace-nowrap flex-nowrap text-base gap-2 snap-start"
					class:tab-active={data.filter === 'unread'}
				>
					<span class:opacity-60={data.filter !== 'unread'}>{$_('label.unread')}</span>
					{#await data.count then { unread }}
						{#if unread}
							<span class="text-sm">{unread}</span>
						{/if}
					{/await}
				</a>
				<a
					href="?filter=starred"
					role="tab"
					class="tab whitespace-nowrap flex-nowrap text-base gap-2 snap-start"
					class:tab-active={data.filter === 'starred'}
				>
					<span class:opacity-60={data.filter !== 'starred'}>{$_('label.starred')}</span>
					{#await data.count then { starred }}
						{#if starred}
							<span class="text-sm">{starred}</span>
						{/if}
					{/await}
				</a>
				<a
					href="?filter=spam"
					role="tab"
					class="tab whitespace-nowrap flex-nowrap text-base gap-2 snap-start"
					class:tab-active={data.filter === 'spam'}
				>
					<span class:opacity-60={data.filter !== 'spam'}>{$_('label.spam')}</span>
					{#await data.count then { spam }}
						{#if spam}
							<span class="text-sm">{spam}</span>
						{/if}
					{/await}
				</a>
			</div>
		</div>

		<Pagination
			limit={data.pagination.limit}
			offset={data.pagination.offset}
			total={data.pagination.total}
		/>
	</div>

	<div class="border border-base-300 mt-[-1px] py-2">
		{#if data.responses.length === 0}
			<div class="opacity-60 italic px-5 py-3">
				{$_('text.no_responses')}
			</div>
		{/if}

		{#each data.responses as response, i}
			<ResponseListItem
				form={data.form}
				{response}
				on:click={() => goto(`/app/responses/${response.id}`)}
			>
				<input
					slot="checkbox"
					type="checkbox"
					value={response.id}
					class="checkbox checkbox-xs bg-base-100 border-2 border-current opacity-60 hover:opacity-100 checked:opacity-100"
					bind:group={selected}
				/>
			</ResponseListItem>

			{#if i < data.responses.length - 1}
				<div class="border-b border-base-300"></div>
			{/if}
		{/each}
	</div>

	<div class="flex items-center gap-3 mt-6">
		<div>
			<button type="button" class="btn btn-sm gap-2" on:click={() => onSelectAll()}>
				<CheckboxIcon class="w-4 h-4" />
				<span>{$_('label.select_all')}</span>
			</button>
		</div>

		{#if selected.length}
			<ResponseListBulkActions form={data.form} bind:selected />
		{/if}
	</div>
</div>
