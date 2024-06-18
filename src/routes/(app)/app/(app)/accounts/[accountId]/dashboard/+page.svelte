<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto, invalidateAll } from '$app/navigation';
	import { debounce } from '$lib/helpers';
	import { dashboardSidebarOpen } from '$lib/stores';
	import Alert from '$lib/components/Alert.svelte';
	import Page from '$lib/components/Page.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import ResponseListItem from '$lib/components/ResponseListItem.svelte';
	import FormResponseCount from '$lib/components/FormResponseCount.svelte';
	import ChevronLeftIcon from '$lib/components/icons/ChevronLeft.svelte';
	import ChevronRightIcon from '$lib/components/icons/ChevronRight.svelte';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import type { PageData } from './$types';
	import Form from '$lib/components/Form.svelte';

	export let data: PageData;

	const _onVisibilityChange = debounce(() => {
		if (!document.hidden) {
			invalidateAll();
		}
	}, 5000);

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
	$: userEmailVerified = !!data.user?.emailVerified;
</script>

<svelte:document on:visibilitychange={() => _onVisibilityChange()} />

<Page>
	<div>
		<div class="opacity-60">{data.account.name}</div>
		<div class="text-2xl">{$_('title.welcome_back', { values: { name: data.user?.name } })}</div>
	</div>

	{#if !userEmailVerified}
		<Alert variant="warning">
			{$_('text.email_not_verified')}

			<svelte:fragment slot="actions">
				<Form action="?/resendEmailVerification" let:loading>
					{#if loading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else}
						<button type="submit" class="link">{$_('button.resend_email_verification')}</button>
					{/if}
				</Form>
			</svelte:fragment>
		</Alert>
	{/if}

	{#await data.encryptionKeys then keys}
		{#if data.account.encryptionEnabled && keys === 0}
			<Alert variant="warning">
				{$_('text.warning_no_encryption_keys')}

				<svelte:fragment slot="actions">
					<a href="/app/accounts/{data.account.id}/encryption_keys" class="link"
						>{$_('button.create')}</a
					>
				</svelte:fragment>
			</Alert>
		{/if}
	{/await}

	<div class="flex flex-wrap lg:flex-nowrap gap-8">
		<div class="grow flex flex-col gap-6">
			{#if data.forms.length === 0}
				<div class="prose">
					<MarkdownRenderer value={$_('text.dashboard_no_forms')} />
				</div>

				<div class="flex items-center gap-3">
					<a href="/app/accounts/{data.account.id}/forms#create" class="btn btn-primary">
						<PlusIcon class="w-4 h-4" />
						{$_('button.create_form')}
					</a>
				</div>
			{:else}
				<div>
					<div class="border border-base-300 rounded-md mt-[-1px] py-2">
						<div class="opacity-60 px-5 pb-2">
							<span class="text-sm">{$_('label.latest_responses')}</span>
						</div>

						{#if data.responses.length === 0}
							<div class="opacity-60 italic px-5 py-3">
								{$_('text.no_responses')}
							</div>
						{/if}

						{#each groupedResponses as { form, responses }, i}
							<div class="flex px-5 py-2 bg-base-200/50">
								<div class="grow">
									<a href={`/app/forms/${form.id}/inbox`}>
										<span class="text-sm font-bold max-w-72 truncate">{form.name}</span>
									</a>
								</div>

								<div>
									{#await data.count}
										<span></span>
									{:then count}
										<FormResponseCount {count} formId={form.id} received={form.receivedResponses} />
									{/await}
								</div>
							</div>

							{#each responses as response, i}
								<ResponseListItem
									{form}
									{response}
									on:click={() => goto(`/app/responses/${response.id}`)}
								></ResponseListItem>
								{#if i < responses.length - 1}
									<div class="border-b border-base-300"></div>
								{/if}
							{/each}
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="relative hidden xl:block">
			<div>
				<button
					type="button"
					class="bg-base-200 rounded-sm absolute top-1 p-0.5"
					class:left-0={$dashboardSidebarOpen}
					class:right-0={!$dashboardSidebarOpen}
					on:click={() => ($dashboardSidebarOpen = !$dashboardSidebarOpen)}
				>
					{#if $dashboardSidebarOpen}
						<ChevronRightIcon class="w-4 h-4" />
					{:else}
						<ChevronLeftIcon class="w-4 h-4" />
					{/if}
				</button>
			</div>
		</div>

		<div class="shrink-0 flex flex-col gap-6 max-w-64" class:xl:hidden={!$dashboardSidebarOpen}>
			<div>
				<div class="text-lg">{$_('label.forms')}</div>
				<div class="flex flex-col gap-2 text-sm">
					<div>
						<p>{$_('text.info_forms', { values: { forms: data.forms.length } })}</p>
					</div>

					<div>
						<a href="/app/accounts/{data.account.id}/forms" class="link"
							>{$_('button.manage_forms')}</a
						>
					</div>

					<div>
						<a href="/app/accounts/{data.account.id}/forms#create" class="link"
							>{$_('button.create_form')}</a
						>
					</div>
				</div>
			</div>

			<div>
				<div class="text-lg">{$_('label.your_account')}</div>
				<div class="flex flex-col gap-2 text-sm">
					<div>
						<p>{$_('text.info_billing', { values: { plan: data.account.plan?.name || '-' } })}</p>
					</div>
					<div>
						<a href="/app/accounts/{data.account.id}/settings" class="link"
							>{$_('button.settings')}</a
						>
					</div>
					<div>
						<a href="/app/accounts/{data.account.id}/api_keys" class="link"
							>{$_('button.manage_api_keys')}</a
						>
					</div>
					<div>
						<a href="/app/accounts/{data.account.id}/billing" class="link"
							>{$_('button.manage_billing')}</a
						>
					</div>
					<div>
						<a href="/app/accounts/{data.account.id}/encryption_keys" class="link"
							>{$_('button.manage_encryption_keys')}</a
						>
					</div>
					<div>
						<a href="/app/accounts/{data.account.id}/identities" class="link"
							>{$_('button.manage_identities')}</a
						>
					</div>
					<div>
						<a href="/app/accounts/{data.account.id}/users" class="link"
							>{$_('button.manage_users')}</a
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</Page>
