<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Modal from '$lib/components/Modal.svelte';
	import Form from '$lib/components/Form.svelte';
	import LimitReached from '$lib/components/LimitReached.svelte';
	import List from '$lib/components/List.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import ReloadIcon from '$lib/components/icons/Reload.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import { rsa } from '@altcha/crypto';
	import { importPrivateKey } from '$lib/helpers';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let createModalOpen: boolean = false;
	let createPublicKeyImported: CryptoKey;
	let createPublicKey: string = '';
	let createPrivateKey: string = '';
	let createDownloaded: boolean = false;

	$: encryptionKeys = data.encryptionKeys;

	async function onDownloadPrivateKey() {
		const hash = await rsa.getPublicKeyId(await rsa.exportPublicKey(createPublicKeyImported));
		const blob = new Blob([createPrivateKey], { type: 'text/plain' });
		const a = document.createElement('a');
		a.setAttribute('download', `altcha_private_key_${hash.replace(/:/g, '')}.pem`);
		a.setAttribute('href', URL.createObjectURL(blob));
		a.click();
		createDownloaded = true;
	}

	async function onGenerate() {
		const kp = await rsa.generateKeyPair();
		createPublicKeyImported = kp.publicKey;
		createPublicKey = await rsa.exportPublicKeyPem(kp.publicKey);
		createPrivateKey = await rsa.exportPrivateKeyPem(kp.privateKey);
		createDownloaded = false;
	}

	function onModalClose() {
		createPublicKey = '';
		createPrivateKey = '';
		createDownloaded = false;
	}

	function onModalOpen() {
		onGenerate();
	}

	function onModalSubmit() {
		if (createPrivateKey) {
			importPrivateKey(createPrivateKey);
		}
	}
</script>

{#if !data.canAddEncryptionKey}
	<LimitReached />
{/if}

{#if !data.account.encryptionEnabled}
	<Alert>
		{$_('text.encryption_disabled')}

		<svelte:fragment slot="actions">
			<a href="/app/accounts/{data.account.id}/settings" class="link">{$_('label.settings')}</a>
		</svelte:fragment>
	</Alert>
{/if}

<div class="prose max-w-full">
	<MarkdownRenderer value={$_('text.encryption_keys_info')} />
</div>

<div>
	<button
		type="button"
		class="btn btn-primary"
		disabled={!data.canAddEncryptionKey}
		on:click|preventDefault={() => (createModalOpen = true)}
	>
		<PlusIcon class="w-4 h-4" />
		<span>{$_('button.create_encryption_key')}</span>
	</button>
</div>

<List items={encryptionKeys} let:item={encryptionKey}>
	<div class="flex flex-wrap items-center gap-3">
		<div class="grow">
			<span
				class="font-bold font-mono"
				class:line-through={encryptionKey.deleted}
				class:opacity-60={encryptionKey.deleted}>{encryptionKey.hash}</span
			>
			{#if encryptionKey.deleted}
				<span class="text-error">{$_('status.invalidated')}</span>
			{/if}
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
							<Form
								class="grow flex"
								action="?/deleteEncryptionKey"
								confirmText={$_('text.confirm_key_invalidate', {
									values: { name: encryptionKey.hash }
								})}
								data={{ encryptionKeyId: encryptionKey.id }}
							>
								<button type="submit" class="grow flex items-center">
									<span class="grow text-left">{$_('button.invalidate')}</span>
									<DeleteIcon class="w-4 h-4" />
								</button>
							</Form>
						</li>
					</ul>
				</DropdownMenu>
			</div>
		</div>
	</div>
</List>

<Modal
	action="?/createEncryptionKey"
	disabled={!createDownloaded}
	title={$_('title.new_encryption_key')}
	data={{
		publicKey: createPublicKey
	}}
	bind:open={createModalOpen}
	on:close={() => onModalClose()}
	on:open={() => onModalOpen()}
	on:submit={() => onModalSubmit()}
	let:error
>
	<div class="flex flex-col gap-6">
		<div>
			{$_('text.new_encryption_key')}
		</div>

		<div
			class="flex flex-col gap-3 bg-base-200 text-xs font-mono p-3 rounded-md overflow-auto max-h-44"
		>
			<pre><code>{createPublicKey}</code></pre>

			<pre><code>{createPrivateKey}</code></pre>

			<div class="opacity-60">
				<button
					type="button"
					class="inline-flex gap-2 items-center"
					on:click|preventDefault={() => onGenerate()}
				>
					<ReloadIcon class="w-3 h-3" />
					<span class="link">{$_('button.regenerate')}</span>
				</button>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<div class="flex gap-3">
				<div class="pt-1">
					<CheckIcon class="w-4 h-4" />
				</div>
				<div>
					<p>{$_('text.download_encryption_key')}</p>
				</div>
			</div>

			<div class="flex gap-3">
				<div class="pt-1">
					<CheckIcon class="w-4 h-4" />
				</div>
				<div>
					<p>{$_('text.share_encryption_key')}</p>
				</div>
			</div>
		</div>

		<div>
			<button type="button" class="btn btn-primary gap-3" on:click={() => onDownloadPrivateKey()}>
				<DownloadIcon class="w-4 h-4" />
				<span>{$_('button.download_encryption_key')}</span>
			</button>
		</div>
	</div>
</Modal>
