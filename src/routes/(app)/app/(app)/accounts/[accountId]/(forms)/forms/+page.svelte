<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Page from '$lib/components/Page.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import Templates from '$lib/components/Templates.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import SettingsIcon from '$lib/components/icons/Settings.svelte';
	import SearchIcon from '$lib/components/icons/Search.svelte';
	import InboxIcon from '$lib/components/icons/Inbox.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import LimitReached from '$lib/components/LimitReached.svelte';
	import FormResponseCount from '$lib/components/FormResponseCount.svelte';
	import List from '$lib/components/List.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let createModalOpen = false;
	let createTemplateId: string | undefined = void 0;
	let name: string = '';
	let templatesFilter: string = '';

	$: forms = data.forms;
	$: limitForms = data.account.plan?.limitForms || 0;
	$: canAddForm = forms.length < limitForms;
	$: canDelete = data.accountRole === 'admin';

	onMount(() => {
		if (browser && location.hash === '#create' && canAddForm) {
			createModalOpen = true;
			location.hash = '';
		}
	});
</script>

<Page title={$_('label.forms')}>
	{#if !canAddForm}
		<LimitReached />
	{/if}

	<div>
		<button
			type="button"
			class="btn btn-primary"
			disabled={!canAddForm}
			on:click|preventDefault={() => (createModalOpen = true)}
		>
			<PlusIcon class="w-4 h-4" />
			<span>{$_('button.create_form')}</span>
		</button>
	</div>

	<List items={forms} let:item={form}>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="grow">
				<div class="max-w-xs truncate">
					<a href="/app/forms/{form.id}/inbox" class="link text-lg font-bold">{form.name}</a>
				</div>
			</div>

			<div class="grow flex gap-3 items-center justify-end">
				<div class="pr-3">
					{#await data.count}
						<span></span>
					{:then count}
						<FormResponseCount {count} formId={form.id} received={form.receivedResponses} />
					{/await}
				</div>

				<div>
					<span
						class="badge"
						class:badge-ghost={form.status === 'archived'}
						class:badge-neutral={form.status === 'draft'}
						class:badge-success={form.status === 'published'}>{$_('status.' + form.status)}</span
					>
				</div>

				<div>
					<div class="dropdown dropdown-end dropdown-bottom">
						<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
							<MoreHorizontalIcon class="w-4 h-4" />
						</div>
						<DropdownMenu autoclose>
							<ul class="menu gap-1">
								<li class="menu-title">{$_('label.actions')}</li>
								<li>
									<a href="/app/forms/{form.id}/inbox" class="grow flex">
										<span class="grow">{$_('button.inbox')}</span>
										<InboxIcon class="w-4 h-4" />
									</a>
								</li>
								<li>
									<a href="/app/forms/{form.id}/settings" class="grow flex">
										<span class="grow">{$_('button.settings')}</span>
										<SettingsIcon class="w-4 h-4" />
									</a>
								</li>
								{#if canDelete}
									<li>
										<a href="/app/forms/{form.id}/delete" class="grow flex">
											<span class="grow">{$_('button.delete')}</span>
											<DeleteIcon class="w-4 h-4" />
										</a>
									</li>
								{/if}
							</ul>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</div>
	</List>
</Page>

<Modal
	action="?/createForm"
	buttonLabel={$_('button.create')}
	title={$_('title.create_form')}
	bind:open={createModalOpen}
	medium
>
	<input type="hidden" name="template" value={createTemplateId} />

	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-6 max-w-md">
			<TextInput
				block={{
					label: $_('label.name'),
					name: 'name',
					required: true,
					type: 'TextInput'
				}}
				bind:value={name}
			/>
		</div>

		<div class="grow flex flex-col border rounded-lg">
			<div class="flex flex-wrap gap-3 items-center bg-base-200/50 p-3">
				<div class="grow w-full xl:w-auto">
					<div class="font-bold">{$_('label.select_template')}</div>
				</div>

				<div class="grow xl:max-w-xs">
					<label class="input input-bordered input-sm flex items-center gap-3 max-w-sm">
						<SearchIcon class="w-4 h-4" />
						<input
							type="text"
							class="grow w-full"
							placeholder={$_('placeholder.search')}
							bind:value={templatesFilter}
						/>
					</label>
				</div>
			</div>

			<div class="bg-base-200/50">
				{#if createModalOpen}
				<Templates
					filter={templatesFilter}
					bind:value={createTemplateId}
					on:select={(ev) => (name = ev.detail.name)}
				/>
				{/if}
			</div>
		</div>
	</div>
</Modal>
