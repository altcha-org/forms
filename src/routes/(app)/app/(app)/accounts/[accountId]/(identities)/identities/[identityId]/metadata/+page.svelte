<script lang="ts">
	import { _ } from 'svelte-i18n';
	import IdentityDataProvider from '$lib/components/IdentityDataProvider.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import List from '$lib/components/List.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import AddBlockIcon from '$lib/components/icons/AddBlock.svelte';
	import EditIcon from '$lib/components/icons/Edit.svelte';
	import ClipboardIcon from '$lib/components/icons/Clipboard.svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import ShieldIcon from '$lib/components/icons/Shield.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import CloseIcon from '$lib/components/icons/Close.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import Form from '$lib/components/Form.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { copyToClipboard } from '$lib/helpers';
	import { encryptionKeys } from '$lib/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	let editModalOpen: boolean = false;
	let editKey: string | null = null;
	let editValue: string | null = null;
	let editRemoveKey: string | null = null;

	$: hasEncryptionKey =
		data.identity.encrypted &&
		$encryptionKeys?.find(({ id }) => id === data.identity.encryptionKeyHash);

	function onAdd() {
		editValue = '';
		editModalOpen = true;
	}

	function onEdit(key: string, value: string) {
		editKey = key;
		editRemoveKey = key;
		editValue = value;
		editModalOpen = true;
	}

	function reset() {
		editKey = null;
		editRemoveKey = null;
		editValue = null;
	}
</script>

<IdentityDataProvider identity={data.identity} let:identityMetadata>
	{#if !identityMetadata}
		<div class="italic opacity-60">
			{$_('text.no_records')}
		</div>
	{:else}
		{#if data.identity.encrypted}
			<Alert variant="success">
				<div class="grow flex gap-3 items-center">
					<ShieldIcon class="w-4 h-4 text-success" />
					<span>{$_('text.response_encrypted')}</span>
				</div>

				<div slot="actions" class="flex gap-3 items-center text-sm">
					{#if hasEncryptionKey}
						<CheckIcon class="w-4 h-4 text-success" />
					{:else}
						<CloseIcon class="w-4 h-4 text-error" />
					{/if}

					<div class="text-sm font-mono opacity-60">
						<a href="/app/profile/encryption_keys?highlight={data.identity.encryptionKeyHash}"
							>{data.identity.encryptionKeyHash}</a
						>
					</div>
				</div>
			</Alert>
		{/if}

		<List items={identityMetadata}>
			<svelte:fragment let:item>
				<div class="text-sm opacity-60">{item[0]}</div>
				<div>
					<MarkdownRenderer value={item[1]} />
				</div>
			</svelte:fragment>

			<svelte:fragment slot="actions" let:item>
				<div class="dropdown dropdown-end dropdown-bottom pt-1.5">
					<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
						<MoreHorizontalIcon class="w-4 h-4" />
					</div>
					<DropdownMenu autoclose>
						<ul class="menu gap-1">
							<li class="menu-title">{$_('label.actions')}</li>
							<li>
								<button
									type="button"
									class="flex grow"
									on:click|preventDefault={() => copyToClipboard(item[1])}
								>
									<span class="grow text-left">{$_('button.copy_to_clipboard')}</span>
									<ClipboardIcon class="w-4 h-4" />
								</button>
							</li>
							<li>
								<button
									type="button"
									class="grow flex"
									on:click|preventDefault={() => onEdit(item[0], item[1])}
								>
									<span class="grow text-left">{$_('button.edit')}</span>
									<EditIcon class="w-4 h-4" />
								</button>
							</li>
							<li>
								<Form
									action="?/updateMetadata"
									data={{
										metadata: JSON.stringify(Object.fromEntries(identityMetadata)),
										removeKey: item[0]
									}}
									class="grow flex"
									confirmText={$_('text.confirm_remove', { values: { name: item[0] } })}
								>
									<button type="submit" class="grow flex items-center">
										<span class="grow text-left">{$_('button.remove')}</span>
										<DeleteBackIcon class="w-4 h-4" />
									</button>
								</Form>
							</li>
						</ul>
					</DropdownMenu>
				</div>
			</svelte:fragment>
		</List>
	{/if}

	<div>
		<button type="button" class="btn btn-sm btn-primary" on:click|preventDefault={() => onAdd()}>
			<AddBlockIcon class="w-4 h-4" />
			<span>{$_('button.add_entry')}</span>
		</button>
	</div>

	<Modal
		action="?/updateMetadata"
		data={{
			metadata: JSON.stringify(Object.fromEntries(identityMetadata)),
			removeKey: editRemoveKey
		}}
		title={editRemoveKey ? editRemoveKey : $_('title.add_metadata')}
		bind:open={editModalOpen}
		on:close={() => reset()}
	>
		<div class="flex flex-col gap-6">
			<TextInput
				block={{
					label: $_('label.metadata_key'),
					name: 'key',
					options: {
						maxLength: 100
					},
					required: true
				}}
				bind:value={editKey}
			/>

			<MultiLineTextInput
				block={{
					label: $_('label.metadata_value'),
					name: 'value',
					options: {
						maxLength: 500
					},
					required: true
				}}
				markdown
				bind:value={editValue}
			/>
		</div>
	</Modal>
</IdentityDataProvider>
