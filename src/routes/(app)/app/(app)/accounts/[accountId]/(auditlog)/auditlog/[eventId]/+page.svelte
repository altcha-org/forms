<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import Head from '$lib/components/Head.svelte';
	import Page from '$lib/components/Page.svelte';
	import List from '$lib/components/List.svelte';
	import { decryptData } from '$lib/helpers';
	import { formatTimeAgo } from '$lib/format';
	import { encryptionKeys } from '$lib/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	$: account = data.account;
	$: event = data.event;
</script>

<Head baseUrl="/app/accounts/{account.id}">
	<ul slot="breadcrumbs">
		<li>
			<a href="/app/accounts">{$_('label.accounts')}</a>
		</li>
		<li>
			<a href="/app/accounts">{account.name}</a>
		</li>
		<li>
			<a href="/app/accounts/{account.id}/auditlog">{$_('label.auditlog')}</a>
		</li>
		<li>
			<span>{event.event}</span>
		</li>
	</ul>

	<div class="flex items-end gap-3 mb-1">
		<div class="text-2xl font-bold">{event.event}</div>
	</div>

	<div class="flex flex-wrap gap-x-2 text-xs lg:text-sm opacity-60">
		<span class="w-full lg:w-auto">{$_('label.created')}: {formatTimeAgo(event.createdAt)}</span>
		<span class="hidden lg:inline">&bull;</span>
		<span class="w-full lg:w-auto">{$_('label.id')}: {event.id}</span>
	</div>
</Head>

<Page>
	<div class="flex flex-col gap-6">
		<List
			items={[
				[$_('label.event'), event.event],
				[$_('label.event_id'), event.id],
				[$_('label.description'), event.description],
				[$_('label.created'), event.createdAt.toISOString()],
				[$_('label.user_id'), event.userId],
				[$_('label.user'), event.user?.name],
				[$_('label.form_id'), event.formId],
				[$_('label.form'), event.form?.name],
				[$_('label.response_id'), event.responseId],
				[$_('label.ip_address'), event.ipAddress],
				[$_('label.app_node_id'), event.nodeId],
				[$_('label.app_version'), event.version],
				[$_('label.encrypted'), event.encrypted]
			]}
		></List>

		{#if event.dataEncrypted || event.data}
			<div class="text-xl">{$_('label.event_data')}</div>

			<div class="flex flex-col gap-3">
				<div>
					{#if event.dataEncrypted && event.encryptionKeyHash}
						{#await decryptData(event.dataEncrypted, event.encryptionKeyHash, $encryptionKeys)}
							<div>..,.</div>
						{:then data}
							{#if data === null}
								<div>Unable to decrypt data.</div>
							{:else if data?.changes}
								<List items={data.changes} let:item>
									{#if Array.isArray(item)}
										<div class="text-sm opacity-60">{item[0].join('.')}</div>
										<div class="flex border">
											<div class="grow line-through bg-base-200 px-3 py-1">
												{item[1] === void 0 ? '—' : item[1]}
											</div>
											<div class="bg-base-200 px-3 py-1">
												<span class="opacity-40">&rarr;</span>
											</div>
											<div class="w-1/2 line-clamp-4 px-3 py-1">
												{item[2] === void 0 ? '—' : item[2]}
											</div>
										</div>
									{/if}
								</List>
							{/if}
						{/await}
					{:else if event.data?.changes}
						<List items={event.data.changes} let:item>
							{#if Array.isArray(item)}
								<div class="text-sm opacity-60">{item[0].join('.')}</div>
								<div class="flex border">
									<div class="grow line-through bg-base-200 px-3 py-1">
										{item[1] === void 0 ? '—' : item[1]}
									</div>
									<div class="bg-base-200 px-3 py-1">
										<span class="opacity-40">&rarr;</span>
									</div>
									<div class="w-1/2 line-clamp-4 px-3 py-1">
										{item[2] === void 0 ? '—' : item[2]}
									</div>
								</div>
							{/if}
						</List>
					{/if}
				</div>
			</div>
		{/if}

		{#if event.event === 'responses.delete'}
			<div class="flex flex-col gap-3 border rounded-md p-3">
				{#if event.response?.deleted}
					<div class="text-sm">{$_('text.deleted_response')}</div>
					<Form
						action="/app/responses/{event.responseId}/data?/undelete"
						confirmText={$_('text.confirm_revert_delete')}
						data={{
							responseId: event.responseId
						}}
					>
						<button type="submit" class="btn btn-sm">{$_('button.revert_delete')}</button>
					</Form>
				{:else}
					<div class="text-sm">{$_('text.deleted_response_reverted')}</div>
				{/if}
			</div>
		{/if}
	</div>
</Page>
