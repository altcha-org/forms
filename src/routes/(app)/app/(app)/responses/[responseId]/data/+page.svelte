<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import FormDataRenderer from '$lib/components/FormDataRenderer.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import FormBlock from '$lib/components/blocks/FormBlock.svelte';
	import ShieldIcon from '$lib/components/icons/Shield.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import CloseIcon from '$lib/components/icons/Close.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDown.svelte';
	import LockIcon from '$lib/components/icons/Lock.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import TrashIcon from '$lib/components/icons/Trash.svelte';
	import ResponseDataProvider from '$lib/components/ResponseDataProvider.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Export from '$lib/components/Export.svelte';
	import { encryptionKeys, form, formExport } from '$lib/stores';
	import { forceDownload } from '$lib/helpers';
	import { formatDateTime } from '$lib/format';
	import type { IFileWithoutAccount, IFormBlock } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	const CANNOT_EDIT = ['SignatureInput'];

	let editModalOpen = false;
	let editBlock: IFormBlock | undefined = void 0;
	let editValue: any = void 0;

	$: hasEncryptionKey =
		data.response.encrypted &&
		$encryptionKeys?.find(({ id }) => id === data.response.encryptionKeyHash);

	function onDownloadEncrypted() {
		if (data.response.dataEncrypted) {
			forceDownload(data.response.dataEncrypted, `${data.response.id}.json.enc`);
		}
	}

	async function onDownload() {
		$formExport = true;
	}

	function onEdit(block: IFormBlock, value?: any) {
		editBlock = block;
		editValue = value;
		editModalOpen = true;
	}

	function onFileRemove(file: IFileWithoutAccount) {
		if (editBlock) {
			editValue = String(editValue)
				.split(',')
				.filter((p) => p !== file.id)
				.join(',');
		}
	}
</script>

<div class="flex flex-col gap-8">
	{#if data.response.spam || data.response.encrypted}
		<div class="flex flex-col gap-3">
			{#if data.response.spam}
				<div class="flex items-center gap-3 bg-warning/10 p-3 rounded-lg">
					<div>
						<TrashIcon class="w-4 h-4 text-warning" />
					</div>
					<div class="grow">
						{$_('text.this_is_spam')}
					</div>
					<div>
						<Form action="/app/responses/{data.response.id}/data?/toggleSpam" class="flex">
							<button type="submit" class="link">
								<span>{$_('button.not_spam')}</span>
							</button>
						</Form>
					</div>
				</div>
			{/if}

			{#if data.response.encrypted}
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
							<a href="/app/profile/encryption_keys?highlight={data.response.encryptionKeyHash}"
								>{data.response.encryptionKeyHash}</a
							>
						</div>
					</div>
				</Alert>
			{/if}
		</div>
	{/if}

	<ResponseDataProvider response={data.response} let:responseData>
		{#if responseData === null}
			<div class="flex flex-col gap-3 border rounded-md p-3">
				<div>{$_('text.unable_to_decrypt_data')}</div>
				<div>
					<a href="/app/profile/encryption_keys" class="link text-sm"
						>{$_('button.import_encryption_key')}</a
					>
				</div>
			</div>
		{:else if responseData}
			<FormDataRenderer
				data={responseData}
				files={data.files}
				form={$form}
				on:edit={(ev) => onEdit(ev.detail.block, ev.detail.value)}
			/>
			<Modal
				action="?/updateField"
				data={{
					formData: JSON.stringify(responseData)
				}}
				disabled={editBlock && CANNOT_EDIT.includes(editBlock.type)}
				title={$_('title.edit')}
				bind:open={editModalOpen}
			>
				{#if editBlock}
					<input type="hidden" name="name" value={editBlock.name} />

					{#if CANNOT_EDIT.includes(editBlock.type)}
						<div>
							<p>{$_('text.cannot_be_edited')}</p>
						</div>
					{:else if editBlock.type === 'FileInput'}
						{#await data.files}
							...
						{:then formFiles}
							{@const files = formFiles.filter((file) => editValue.includes(file.id))}

							<input type="hidden" name="value" value={editValue} />

							{#if files.length === 0}
								<div>&mdash;</div>
							{/if}

							{#each files as file}
								{@const removed = !editValue.includes(file.id)}
								<div class="flex items-center gap-3">
									<div class="grow">
										<div class="max-w-xs truncate" class:line-through={removed}>{file.name}</div>
									</div>
									<div>
										<button
											type="button"
											class="btn btn-sm btn-circle btn-ghost"
											disabled={removed}
											on:click={() => onFileRemove(file)}
										>
											<DeleteIcon class="w-4 h-4" />
										</button>
									</div>
								</div>
							{/each}
						{/await}
					{:else if editBlock.type === 'AddressInput'}
						<MultiLineTextInput
							block={{
								...editBlock,
								name: 'value'
							}}
							bind:value={editValue}
						/>
					{:else}
						<FormBlock
							block={{
								...editBlock,
								name: 'value'
							}}
							bind:value={editValue}
						/>
					{/if}
				{/if}
			</Modal>
		{/if}
	</ResponseDataProvider>

	<div class="bg-base-200/50 rounded-md flex gap-3 p-3">
		<table class="table table-sm">
			<tr>
				<th>{$_('label.received')}:</th>
				<td>{formatDateTime(data.response.createdAt)}</td>
			</tr>
			<tr>
				<th>{$_('label.id')}:</th>
				<td>{data.response.id}</td>
			</tr>
		</table>
	</div>

	<div class="flex gap-3">
		<button
			type="button"
			class="btn btn-sm"
			on:click|preventDefault={() => onDownload()}
		>
			<span>{$_('button.download')}</span>
		</button>

		{#if data.response.encrypted}
			<button
				type="button"
				class="btn btn-sm"
				on:click|preventDefault={() => onDownloadEncrypted()}
			>
				<LockIcon class="w-4 h-4" />
				<span>{$_('button.download_encrypted')}</span>
			</button>
		{/if}
	</div>
</div>

<Modal
	action=""
	title={$_('title.export')}
	subtitle={data.response.id}
	hideButton
	bind:open={$formExport}
>
	{#if $formExport}
	<Export
		form={$form}
		singleResponse={true}
		responseIds={[data.response.id]}
		on:finish={() => $formExport = false}
	/>
	{/if}
</Modal>
