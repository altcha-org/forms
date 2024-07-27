<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getPrivateKeyId, importPrivateKey } from '$lib/helpers';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import FileInput from '$lib/components/blocks/FileInput.svelte';
	import List from '$lib/components/List.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import KeyIcon from '$lib/components/icons/Key.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import { encryptionKeys } from '$lib/stores';
	import { isValidPrivateKey } from '$lib/helpers';
	import type { IEncryptionPrivateKey } from '$lib/types';

	let importModalOpen: boolean = false;
	let importFromClipboard: boolean = false;
	let privateKeyPEM: string = '';

	function onDeleteKey(key: IEncryptionPrivateKey) {
		if (confirm($_('text.confirm_remove', { values: { name: key.id } }))) {
			$encryptionKeys = $encryptionKeys.filter(({ id }) => id !== key.id);
		}
	}

	function onDownloadKey(key: IEncryptionPrivateKey) {
		const blob = new Blob([key.privateKey], { type: 'text/plain' });
		const a = document.createElement('a');
		a.setAttribute('download', `altcha_private_key_${key.id.replace(/:/g, '')}.pem`);
		a.setAttribute('href', URL.createObjectURL(blob));
		a.click();
	}

	async function onFileSelect(file: File) {
		const blob = new Blob([file]);
		const text = await blob.text();
		if (isValidPrivateKey(text)) {
			privateKeyPEM = text;
		}
	}

	function onModalClose() {
		privateKeyPEM = '';
		importFromClipboard = false;
	}

	async function onImportSubmit() {
		if (privateKeyPEM) {
			await importPrivateKey(privateKeyPEM);
			privateKeyPEM = '';
		}
	}
</script>

<div class="prose">
	<MarkdownRenderer value={$_('text.private_encryption_keys')} />
</div>

<div>
	<button
		type="button"
		class="btn btn-primary"
		on:click|preventDefault={() => (importModalOpen = true)}
	>
		<PlusIcon class="w-4 h-4" />
		<span>{$_('button.import_encryption_key')}</span>
	</button>
</div>

{#if $encryptionKeys}
	<List items={$encryptionKeys} let:item={key}>
		<div class="flex flex-wrap items-center gap-3">
			<div class="grow">
				<div class="font-bold font-mono">{key.id}</div>
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
								<button type="button" class="grow flex" on:click={() => onDownloadKey(key)}>
									<span class="grow">{$_('button.download')}</span>
									<DownloadIcon class="w-4 h-4" />
								</button>
							</li>
							<li>
								<button type="button" class="grow flex" on:click={() => onDeleteKey(key)}>
									<span class="grow">{$_('button.delete')}</span>
									<DeleteIcon class="w-4 h-4" />
								</button>
							</li>
						</ul>
					</DropdownMenu>
				</div>
			</div>
		</div>
	</List>
{/if}

<Modal
	action=""
	title={$_('title.import_encryption_key')}
	bind:open={importModalOpen}
	on:close={() => onModalClose()}
	on:submit={() => onImportSubmit()}
	let:error
>
	<div class="flex flex-col gap-3">
		{#if !importFromClipboard && !privateKeyPEM}
			<FileInput
				block={{
					label: $_('label.encryption_key'),
					name: 'privateKey',
					options: {
						accept: '.pem'
					},
					required: true
				}}
				ghost
				hideFiles
				submitUrl=""
				on:file={(ev) => onFileSelect(ev.detail)}
			>
				<div
					class="flex gap-3 items-center border border-base-content/30 border-dashed rounded-lg px-6 min-h-24"
				>
					<div>
						<KeyIcon class="w-4 h-4" />
					</div>
					<div>
						{$_('text.drop_encryption_key_here')}
					</div>
				</div>
			</FileInput>
		{/if}

		<div>
			{#if importFromClipboard || privateKeyPEM}
				<MultiLineTextInput
					block={{
						label: $_('label.encryption_key'),
						name: 'privateKey',
						placeholder: '-----BEGIN PRIVATE KEY-----',
						required: true
					}}
					error={error?.fields?.privateKey}
					bind:value={privateKeyPEM}
				/>
			{:else}
				<button type="button" class="link text-sm" on:click={() => (importFromClipboard = true)}
					>{$_('button.paste_from_clipboard')}</button
				>
			{/if}
		</div>

		{#if privateKeyPEM}
			<div class="font-mono text-sm">
				{#await getPrivateKeyId(privateKeyPEM)}
					...
				{:then result}
					{result}
				{:catch _err}
					<div></div>
				{/await}
			</div>
		{/if}
	</div>
</Modal>
