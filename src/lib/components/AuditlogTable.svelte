<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Pagination from '$lib/components/Pagination.svelte';
	import DetailIcon from '$lib/components/icons/Detail.svelte';
	import DocumentIcon from '$lib/components/icons/Document.svelte';
	import { formatDateTime } from '$lib/format';
	import type { IAuditlogEventListItem } from '$lib/types';

	export let accountId: string;
	export let events: IAuditlogEventListItem[];
	export let pagination: {
		offset: number;
		limit: number;
		total: number | Promise<number>;
	} | null = null;
	export let hideFormColumn: boolean = false;
</script>

{#if pagination}
	<div>
		<Pagination limit={pagination.limit} offset={pagination.offset} total={pagination.total} />
	</div>
{/if}

<div class="border border-base-300 rounded-md">
	<div class="overflow-x-auto">
		<table class="table">
			<thead>
				<tr>
					<th>{$_('label.event')}</th>
					<th>{$_('label.user')}</th>
					{#if !hideFormColumn}
						<th>{$_('label.form')}</th>
					{/if}
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#if events.length === 0}
					<tr>
						<td colspan="4">
							<div class="italic opacity-60">{$_('text.no_records')}</div>
						</td>
					</tr>
				{/if}

				{#each events as event}
					{@const op = event.event.split('.')[1][0].toUpperCase()}
					<tr>
						<td>
							<div class="flex gap-2">
								<div>
									<span
										class="badge badge-sm"
										class:badge-ghost={op === 'A'}
										class:badge-success={op === 'C'}
										class:badge-secondary={op === 'U'}
										class:badge-error={op === 'D'}>{op}</span
									>
								</div>
								<div>
									<div>{event.event}</div>
									<div class="text-xs opacity-60">{formatDateTime(event.createdAt)}</div>
								</div>
							</div>
						</td>
						<td class="w-full">
							<div>{event.user?.name || '-'}</div>
							<div class="text-xs opacity-60">{event.userId || '-'}</div>
						</td>
						{#if !hideFormColumn}
							<td>
								<div class="flex gap-2 items-center">
									{#if event.formId}
										<a href="/app/forms/{event.formId}" class="link max-w-[10rem] truncate"
											>{event.form?.name || '?'}</a
										>
									{/if}

									{#if event.responseId}
										<span class="opacity-30">/</span>
										<a href="/app/responses/{event.responseId}" class="link">
											<DocumentIcon class="w-4 h-4" />
										</a>
									{/if}
								</div>
							</td>
						{/if}
						<td>
							<div class="flex justify-end">
								<a href="/app/accounts/{accountId}/auditlog/{event.id}">
									<DetailIcon class="w-4 h-4" />
								</a>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
