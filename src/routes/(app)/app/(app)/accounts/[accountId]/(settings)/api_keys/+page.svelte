<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import Form from '$lib/components/Form.svelte';
	import LimitReached from '$lib/components/LimitReached.svelte';
	import List from '$lib/components/List.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import MultiCheckboxInput from '$lib/components/blocks/MultiCheckboxInput.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import ClipboardIcon from '$lib/components/icons/Clipboard.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import EditIcon from '$lib/components/icons/Edit.svelte';
	import bubble from '$lib/bubble';
	import { clone, copyToClipboard } from '$lib/helpers';
	import { formatTimeAgo } from '$lib/format';
	import type { PageData } from './$types';
	import Alert from '$lib/components/Alert.svelte';

	type IApiKey = (typeof data.apiKeys)[number];

	export let data: PageData;

	let apiKeyModalOpen: boolean = false;
	let updateApiKey: IApiKey | null = null;

	$: apiKeys = data.apiKeys;
	$: supportsFormsApi = data.account.plan?.featureForms !== false;

	function onApiKeyCreate() {
		updateApiKey = {
			features: supportsFormsApi ? ['forms_api', 'antispam_api'] : ['antispam_api'],
			name: 'API Key'
		} as IApiKey;
		apiKeyModalOpen = true;
	}

	function onApiKeyUpdate(apiKey: IApiKey) {
		updateApiKey = clone(apiKey);
		apiKeyModalOpen = true;
	}
</script>

{#if !data.canAddApiKey}
	<LimitReached />
{/if}

<div>
	<button
		type="button"
		class="btn btn-primary"
		disabled={!data.canAddApiKey}
		on:click|preventDefault={() => onApiKeyCreate()}
	>
		<PlusIcon class="w-4 h-4" />
		<span>{$_('button.create_api_key')}</span>
	</button>
</div>

<List items={apiKeys} let:item={apiKey}>
	<div class="flex flex-wrap items-center gap-3">
		<div class="grow">
			<div>
				<span
					class="font-bold"
					class:line-through={apiKey.deleted}
					class:opacity-60={apiKey.deleted}
				>
					{apiKey.name}
				</span>
				{#if apiKey.deleted}
					<span class="text-sm text-error">{$_('status.invalidated')}</span>
				{/if}
			</div>

			<div class="flex items-center gap-1">
				<span
					class="text-sm font-mono"
					class:line-through={apiKey.deleted}
					class:opacity-60={apiKey.deleted}>{apiKey.id}</span
				>
				{#if !apiKey.deleted}
					<button
						type="button"
						class="btn btn-xs btn-circle btn-ghost"
						use:bubble={{
							handler: () => copyToClipboard(apiKey.id),
							text: $_('text.copied')
						}}
					>
						<ClipboardIcon class="w-3 h-3" />
					</button>
				{/if}
			</div>
		</div>
		<div>
			<div class="dropdown dropdown-end dropdown-bottom">
				<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
					<MoreHorizontalIcon class="w-4 h-4" />
				</div>
				<DropdownMenu autoclose>
					<ul class="menu gap-1">
						<li class="menu-title">{$_('label.actions')}</li>
						{#if apiKey.deleted}
							<li>
								<Form
									action="?/deleteApiKey"
									class="grow flex"
									confirmText={$_('text.confirm_delete', { values: { name: apiKey.name } })}
									data={{ apiKeyId: apiKey.id }}
								>
									<button type="submit" class="grow flex items-center">
										<span class="grow text-left">{$_('button.delete')}</span>
										<DeleteIcon class="w-4 h-4" />
									</button>
								</Form>
							</li>
						{:else}
							<li>
								<button
									type="button"
									class="grow flex"
									on:click|preventDefault={() => onApiKeyUpdate(apiKey)}
								>
									<span class="grow">{$_('button.edit')}</span>
									<EditIcon class="w-4 h-4" />
								</button>
							</li>
							<li>
								<button
									type="button"
									class="grow flex"
									on:click|preventDefault={() => void 0}
									use:bubble={{
										handler: () => copyToClipboard(apiKey.secret),
										text: $_('text.copied')
									}}
								>
									<span class="grow">{$_('button.copy_secret_to_clipboard')}</span>
									<ClipboardIcon class="w-4 h-4" />
								</button>
							</li>
							<li>
								<Form
									action="?/invalidateApiKey"
									class="grow flex"
									confirmText={$_('text.confirm_key_invalidate', { values: { name: apiKey.name } })}
									data={{ apiKeyId: apiKey.id }}
								>
									<button type="submit" class="grow flex items-center">
										<span class="grow text-left">{$_('button.invalidate')}</span>
										<DeleteIcon class="w-4 h-4" />
									</button>
								</Form>
							</li>
						{/if}
					</ul>
				</DropdownMenu>
			</div>
		</div>
	</div>
</List>

<Modal
	action={updateApiKey?.id ? '?/updateApiKey' : '?/createApiKey'}
	autocomplete="off"
	title={updateApiKey?.id ? $_('title.update') : $_('title.create')}
	subtitle={updateApiKey?.id
		? $_('label.created_ago', { values: { ago: formatTimeAgo(updateApiKey?.createdAt) } })
		: void 0}
	data={{ apiKeyId: updateApiKey?.id }}
	bind:open={apiKeyModalOpen}
	on:close={() => (updateApiKey = null)}
>
	<div class="flex flex-col gap-6">
		{#if updateApiKey}
			{#if updateApiKey.id}
			<div>
				<Alert variant="warning">
					{$_('text.api_key_update_delay')}
				</Alert>
			</div>

			{/if}
			<TextInput
				autocomplete="off"
				block={{
					label: $_('label.name'),
					name: 'name',
					required: true
				}}
				bind:value={updateApiKey.name}
			/>

			<PasswordInput
				generate="token"
				generateOnMount
				autocomplete="one-time-code"
				copy
				block={{
					help: $_('help.api_key_secret'),
					label: $_('label.secret'),
					name: 'secret',
					options: {
						minLength: 24
					},
					required: true
				}}
				bind:value={updateApiKey.secret}
			/>

			<MultiLineTextInput
				block={{
					help: $_('help.api_key_referrer_domains'),
					label: $_('label.referrer_domains'),
					name: 'referrer',
					options: {
						maxLength: 1000,
						rows: 1
					}
				}}
				bind:value={updateApiKey.referrer}
			/>

			<MultiCheckboxInput
				block={{
					help: $_('help.api_key_features'),
					label: $_('label.features'),
					name: 'features',
					options: {
						inline: true,
						options: [
							{
								disabled: !supportsFormsApi,
								label: $_('feature.forms_api'),
								value: 'forms_api'
							},
							{
								label: $_('feature.antispam_api'),
								value: 'antispam_api'
							}
						]
					}
				}}
				bind:value={updateApiKey.features}
			/>
		{/if}
	</div>
</Modal>
