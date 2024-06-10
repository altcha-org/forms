<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import Form from '$lib/components/Form.svelte';
	import Head from '$lib/components/Head.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Page from '$lib/components/Page.svelte';
	import ResponseDataProvider from '$lib/components/ResponseDataProvider.svelte';
	import StarFillIcon from '$lib/components/icons/StarFill.svelte';
	import MoreIcon from '$lib/components/icons/More.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import RevertIcon from '$lib/components/icons/Revert.svelte';
	import { formatTimeAgo } from '$lib/format';
	import { form } from '$lib/stores';
	import { clone, stringifyBlockValue } from '$lib/helpers';
	import type { LayoutData } from './$types';
	import type { IFormBlock, TResponseData } from '$lib/types';

	export let data: LayoutData;

	let displayValues: any[] = [];

	$: $form = clone(data.response?.form);
	$: badges = getBadges(data);
	$: labels = data.response.labels
		?.map((label) => $form.labels?.find((l) => l.label === label))
		.filter((l) => !!l);
	$: displayBlocks = $form.displayBlocks
		.map((name) => {
			return $form.steps.reduce(
				(acc, step) => {
					if (!acc) {
						return step.blocks.find((block) => block.name === name);
					}
					return acc;
				},
				void 0 as IFormBlock | undefined
			);
		})
		.filter((b) => !!b) as IFormBlock[];
	$: updateDisplayValues(data.response.data || {});

	function updateDisplayValues(formData: TResponseData) {
		displayValues = $form.displayBlocks.map((name) => formData?.[name]).filter((s) => !!s);
	}

	function getBadges(_: typeof data) {
		const badges: string[] = [];
		if (!data.response.read) {
			badges.push('new');
		}
		if (data.response.error) {
			badges.push('error');
		}
		if (data.response.spam) {
			badges.push('spam');
		}
		if (data.response.deleted) {
			badges.push('deleted');
		}
		return badges;
	}
</script>

<ResponseDataProvider
	displayBlocks={data.response.form.displayBlocks}
	response={data.response}
	let:headline
	let:responseData
>
	<Head
		backUrl="/app/forms/{$form.id}/inbox"
		baseUrl="/app/responses/{data.response.id}"
		tabs={[
			{
				href: '/data',
				label: $_('label.data')
			},
			{
				badge: data.countNotes,
				hidden: !data.account.plan?.featureNotes,
				href: '/notes',
				label: $_('label.notes')
			},
			{
				href: '/context',
				label: $_('label.context')
			},
			{
				href: '/identity',
				label: $_('label.identity')
			},
			{
				badge: data.response.logs.filter(({ error }) => !!error).length > 0,
				badgeColor: 'error',
				href: '/logs',
				label: $_('label.logs')
			},
			{
				href: '/audit',
				hidden: !data.account.plan?.featureAuditlog || !data.account.auditlog,
				label: $_('label.audit')
			}
		]}
	>
		<ul slot="breadcrumbs">
			<li>
				<a href="/app/accounts/{data.response.form.account.id}/forms">{$_('label.forms')}</a>
			</li>
			<li>
				<div class="max-w-[12rem] truncate">
					<a href="/app/forms/{$form.id}/inbox">{$form.name}</a>
				</div>
			</li>
		</ul>

		<div class="flex mb-2">
			<div class="grow flex items-end gap-3">
				<div class="flex items-start gap-2">
					<div>
						<div class="flex gap-3">
							<div class="text-xl xl:text-2xl font-bold max-w-md truncate">{headline}</div>

							{#if data.response.flag}
								<div class="pt-1.5">
									<StarFillIcon class="w-5 h-5 text-warning" />
								</div>
							{/if}
						</div>

						{#if responseData}
							{#each displayBlocks.slice(1) as block, i}
								<div class="max-w-md truncate">{stringifyBlockValue(responseData[block.name])}</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>

			<div>
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn btn-sm btn-square gap-2">
						<MoreIcon class="w-5 h-5" />
					</div>
					<DropdownMenu>
						<ul class="menu gap-1">
							<li class="menu-title">{$_('label.actions')}</li>
							<li>
								<Form action="/app/responses/{data.response.id}/data?/toggleRead" class="flex">
									<button type="submit" class="flex grow justify-start items-center gap-3">
										<div class="grow text-left">
											<span>{$_('button.mark_as_read')}</span>
										</div>
										{#if data.response.read}
											<CheckIcon class="w-4 h-4" />
										{/if}
									</button>
								</Form>
							</li>
							<li>
								<Form action="/app/responses/{data.response.id}/data?/toggleStarred" class="flex">
									<button type="submit" class="flex grow justify-start items-center gap-3">
										<div class="grow text-left">
											<span>{$_('button.mark_as_starred')}</span>
										</div>
										{#if data.response.flag}
											<CheckIcon class="w-4 h-4" />
										{/if}
									</button>
								</Form>
							</li>
							<li>
								<Form action="/app/responses/{data.response.id}/data?/toggleSpam" class="flex">
									<button type="submit" class="flex grow justify-start items-center gap-3">
										<div class="grow text-left">
											<span>{$_('button.mark_as_spam')}</span>
										</div>
										{#if data.response.spam}
											<CheckIcon class="w-4 h-4" />
										{/if}
									</button>
								</Form>
							</li>

							{#if $form.labels}
								{#each $form.labels as label}
									<li>
										<Form
											action="/app/responses/{data.response.id}/data?/toggleLabel"
											class="flex"
											data={{
												label: label.label
											}}
										>
											<button type="submit" class="flex grow justify-start items-center gap-3">
												<div class="grow flex gap-3 items-center text-left">
													<span
														class="w-4 h-4 rounded-full"
														style="background-color: {label.color || '#ddd'};"
													></span>
													<span>{label.label}</span>
												</div>
												{#if data.response.labels?.includes(label.label)}
													<CheckIcon class="w-4 h-4" />
												{/if}
											</button>
										</Form>
									</li>
								{/each}
							{/if}

							<li>
								<Form
									action={data.response.deleted
										? `/app/responses/${data.response.id}/data?/undelete`
										: `/app/responses/${data.response.id}/data?/delete`}
									class="flex"
									confirmText={data.response.deleted ? void 0 : $_('text.confirm_delete_response')}
								>
									<button type="submit" class="flex grow justify-start items-center gap-3">
										<div class="grow text-left">
											<span
												>{data.response.deleted ? $_('button.undelete') : $_('button.delete')}</span
											>
										</div>
										{#if data.response.deleted}
											<RevertIcon class="w-4 h-4" />
										{:else}
											<DeleteIcon class="w-4 h-4" />
										{/if}
									</button>
								</Form>
							</li>
						</ul>
					</DropdownMenu>
				</div>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
			{#if badges.length}
				<div class="flex gap-1">
					{#each badges as badge}
						<span
							class="badge"
							class:badge-neutral={badge === 'new'}
							class:badge-error={badge === 'error'}
							class:badge-ghost={badge === 'spam' || badge === 'deleted'}>{badge}</span
						>
					{/each}
				</div>
			{/if}

			{#if labels?.length}
				<div class="flex gap-2 text-sm">
					{#each labels as label}
						{#if label}
							<div class="flex gap-2 items-center border rounded px-2 py-0.5">
								<span
									class="w-3 h-3 rounded-full"
									style="background-color: {label.color || '#ddd'};"
								></span>
								<span>{label.label}</span>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			<div class="flex flex-wrap gap-x-2 text-xs lg:text-sm opacity-60">
				<span class="w-full lg:w-auto"
					>{$_('label.received_ago', {
						values: { ago: formatTimeAgo(data.response.createdAt) }
					})}</span
				>
			</div>
		</div>
	</Head>

	<Page>
		<slot />
	</Page>
</ResponseDataProvider>
