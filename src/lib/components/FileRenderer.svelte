<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatBytes } from '$lib/format';
	import { cipher, rsa } from '@altcha/crypto';
	import { encryptionKeys } from '$lib/stores';
	import FileIcon from '$lib/components/icons/File.svelte';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import ShieldIcon from '$lib/components/icons/Shield.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SignatureIcon from '$lib/components/icons/Signature.svelte';
	import PdfIcon from '$lib/components/icons/Pdf.svelte';
	import { forceDownload } from '$lib/helpers';
	import type { IFileWithoutAccount } from '$lib/types';

	export let file: IFileWithoutAccount;
	export let preview: null = null;
	export let signature: boolean = false;

	let bytesLoaded: number = 0;
	let bytesTotal: number = 0;
	let downloadModalOpen = false;
	let downloading = false;
	let error: string | undefined = void 0;
	let fetching = false;

	$: downloadUrl = `/storage/${file.id}?download=1`;
	$: progress = bytesTotal ? bytesLoaded / bytesTotal : 0;
	$: progressPercent = Math.floor(progress * 100);

	function onDownload() {
		if (file.encrypted) {
			downloadModalOpen = true;
		} else {
			location.href = downloadUrl;
		}
	}

	async function downloadDecrypted() {
		error = void 0;
		fetching = true;
		try {
			const resp = await fetch(downloadUrl);
			const contentLength = resp.headers.get('content-length');
			fetching = false;
			downloading = true;
			bytesLoaded = 0;
			bytesTotal = contentLength ? parseInt(contentLength, 10) : 0;
			if (resp.status !== 200) {
				throw new Error(`Server responded with ${resp.status}.`);
			}
			const response = new Response(
				new ReadableStream({
					async start(controller) {
						const reader = resp.body!.getReader();
						while (true) {
							const { done, value } = await reader.read();
							if (done) {
								break;
							}
							bytesLoaded = bytesLoaded + value.byteLength;
							controller.enqueue(value);
						}
						controller.close();
					}
				})
			);
			const buffer = await response.arrayBuffer();
			const key = $encryptionKeys.find(({ id }) => id === file.encryptionKeyHash);
			if (!key) {
				throw new Error('Unable to decrypt file.');
			}
			const privateKey = await rsa.importPrivateKeyPem(key.privateKey);
			const result = await cipher.decrypt(privateKey, new Uint8Array(buffer));
			forceDownload(result.buffer, file.name);
			downloadModalOpen = false;
		} catch (err: any) {
			error = String(err.message);
		} finally {
			downloading = false;
			fetching = false;
		}
	}

	function reset() {
		error = void 0;
		fetching = false;
		downloading = false;
		bytesLoaded = 0;
		bytesTotal = 0;
	}
</script>

<div class="flex items-center gap-3">
	<div>
		<button
			type="button"
			class="w-14 h-14 bg-base-200 rounded-lg flex justify-center items-center relative"
			on:click|preventDefault={() => onDownload()}
		>
			{#if preview}
				<img src={preview} class="w-full h-full object-cover" alt="" />
			{:else if file.type === 'application/pdf'}
				<PdfIcon class="w-full h-full" />
			{:else}
				<FileIcon class="w-6 h-6 opacity-40" />
			{/if}

			{#if signature}
				<div
					class="absolute flex justify-center items-center w-5 h-5 bg-success text-success-content -right-0.5 -bottom-0.5 rounded-full"
				>
					<SignatureIcon class="w-3 h-3" />
				</div>
			{/if}
		</button>
	</div>

	<div class="flex-1 flex flex-col gap-1 truncate">
		<div class="whitespace-nowrap truncate max-w-xs">
			<button
				type="button"
				class="inline-flex gap-3 items-end link group"
				on:click|preventDefault={() => onDownload()}
			>
				<span>{file.name}</span>
				<DownloadIcon class="w-4 h-4 xl:opacity-0 group-hover:opacity-60 mb-0.5" />
			</button>
		</div>
		<div class="flex gap-2 items-center text-sm">
			<span class="opacity-60">{formatBytes(file.size)}</span>
			{#if file.encrypted}
				<ShieldIcon class="w-3 h- text-success" />
			{/if}
		</div>
	</div>
</div>

<Modal
	action=""
	hideButton
	title={$_('title.download_encrypted_file')}
	bind:open={downloadModalOpen}
	on:open={() => reset()}
>
	<div class="flex flex-col gap-6">
		<div>
			<p>{$_('text.download_encrypted_file')}</p>
		</div>

		{#if error}
			<div class="text-error">
				{error}
			</div>
		{/if}

		{#if fetching}
			<div>
				<p>{$_('text.fetching_file_information')}</p>
			</div>
		{:else if downloading}
			<div>
				<div class="flex text-sm">
					<div class="grow">{$_('text.downloading')}</div>
					<div>{progressPercent}%</div>
				</div>
				{#if !bytesTotal}
					<progress class="progress w-full"></progress>
				{:else}
					<progress class="progress w-full" value={progress} max="1"></progress>
				{/if}
			</div>
		{/if}

		<div>
			<button
				type="button"
				class="btn btn-primary"
				disabled={fetching || downloading}
				on:click|preventDefault={() => downloadDecrypted()}
			>
				<DownloadIcon class="w-4 h-4" />
				<span>{$_('button.decrypt_and_download')}</span>
			</button>
		</div>

		<div>
			<a href={downloadUrl} download class="link text-sm">
				<span>{$_('button.download_encrypted')}</span>
			</a>
		</div>
	</div>
</Modal>
