<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher, getContext, onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { formatBytes } from '$lib/format';
	import { uploadProgress } from '$lib/stores';
	import IMAGE_TYPES from '$lib/consts/imageTypes';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import FormUpload from '$lib/components/FormUpload.svelte';
	import UploadIcon from '$lib/components/icons/Upload.svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import CloseIcon from '$lib/components/icons/Close.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUp.svelte';
	import FileIcon from '$lib/components/icons/File.svelte';
	import ShieldIcon from '$lib/components/icons/Shield.svelte';
	import { matchesFileType } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		accept?: string;
		maxFiles?: string;
		maxFileSize?: string;
	}>;
	export let encrypted: boolean = false;
	export let error: string | undefined = void 0;
	export let ghost: boolean = false;
	export let hideFiles: boolean = false;
	export let preview: boolean = false;
	export let imagePreviews: [File, string][] = [];
	export let showIcon: boolean = true;
	export let submitUrl: string = `${$page.url.pathname}/file`;
	export let value: string | undefined = void 0;
	export let visible: boolean = true;

	const dispatch = createEventDispatcher();
	const limitFileSize = getContext<number>('limitFileSize') || 10;

	let elForm: HTMLFormElement | null;
	let elInput: HTMLInputElement;
	let files: File[] = [];
	let over: boolean = false;

	$: accept = block.options?.accept;
	$: canUpload = !maxFiles || files.length < maxFiles;
	$: maxFileSize =
		1024 * 1024 * Math.min(limitFileSize, parseInt(block.options?.maxFileSize || '10', 10));
	$: maxFiles = parseInt(block.options?.maxFiles || '10', 10);
	$: multiple = maxFiles !== 1;
	$: required = block.required && !preview && visible;

	onDestroy(() => {
		elForm = null;
	});

	onMount(() => {
		elForm = elInput?.closest('form');
	});

	function addFile(file: File) {
		if (!files.includes(file)) {
			if (maxFileSize && file.size > maxFileSize) {
				error = $_('error.file_too_large', { values: { name: file.name } });
			} else if (accept && !matchesFileType(accept, file)) {
				error = $_('error.file_type_not_allowed', { values: { name: file.name } });
			} else if (maxFiles && files.length >= maxFiles) {
				error = $_('error.too_many_files');
			} else {
				files = [...files, file];
				if (IMAGE_TYPES.includes(file.type.toLowerCase())) {
					const url = URL.createObjectURL(file);
					imagePreviews = [...imagePreviews, [file, url]];
					dispatch('image', { file, url });
				}
				elForm?.dispatchEvent(new Event('change'));
				dispatch('file', file);
			}
		}
	}

	function onFileInputChange(ev: Event & { currentTarget: HTMLInputElement }) {
		if (ev.currentTarget) {
			const file = ev.currentTarget.files?.[0];
			if (file) {
				addFile(file);
			}
		}
	}

	function openFilePicker() {
		const input = document.createElement('input');
		input.type = 'file';
		if (multiple) {
			input.multiple = true;
		}
		if (accept?.length) {
			input.accept = accept;
		}
		input.addEventListener('change', () => {
			if (input.files) {
				for (let file of input.files) {
					addFile(file);
				}
			}
		});
		input.click();
	}

	function onCancelUpload(file: File) {
		const progress = $uploadProgress.find((item) => item.file !== file);
		if (progress && !progress.aborted) {
			progress.abort();
			removeFile(file);
		}
	}

	function onDragLeave() {
		if (over) {
			over = false;
		}
	}

	function onDragOver(ev: DragEvent) {
		ev.preventDefault();
		if (!over) {
			over = true;
		}
	}

	function onDrop(ev: DragEvent) {
		ev.preventDefault();
		if (ev.dataTransfer?.items) {
			for (let item of ev.dataTransfer.items) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					if (file) {
						addFile(file);
					}
				}
			}
		}
		if (over) {
			over = false;
		}
	}

	function onRemoveFile(file: File) {
		if (confirm($_('text.confirm_remove', { values: { name: file.name } }))) {
			removeFile(file);
		}
	}

	function removeFile(file: File) {
		files = files.filter((f) => f !== file);
		imagePreviews = imagePreviews.filter(([f]) => f !== file);
		$uploadProgress = $uploadProgress.filter((item) => item.file !== file);
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<FormUpload {files} {submitUrl} let:value={fileIds}>
		<input
			bind:this={elInput}
			type="hidden"
			name={block.name}
			value={Array.isArray(fileIds) ? fileIds.join(',') : fileIds}
		/>
	</FormUpload>

	{#if files.length && !hideFiles}
		<div class="flex flex-col bg-base-100 border border-base-content/30 rounded-md shadow-sm mb-3">
			{#each files as file, i}
				{@const isLast = i === files.length - 1}
				{@const preview = imagePreviews.find((item) => item[0] === file)?.[1]}
				{@const progress = $uploadProgress.find((item) => item.file === file)}
				{@const percent = progress ? Math.min(1, progress.loaded / progress.file.size) : 0}
				<div class="flex gap-3 p-2 relative" class:border-b={!isLast}>
					{#if showIcon}
						<div>
							<div
								class="w-14 h-14 bg-base-200 overflow-hidden rounded flex justify-center items-center"
							>
								{#if preview}
									<img src={preview} class="w-full h-full object-cover" alt="" />
								{:else}
									<FileIcon class="w-6 h-6 opacity-40" />
								{/if}
							</div>
						</div>
					{/if}

					<div class="flex-1 flex flex-col gap-1 justify-center truncate">
						<div class="whitespace-nowrap truncate max-w-xs">{file.name}</div>
						<div class="flex items-center text-sm opacity-60">
							<span>{formatBytes(file.size)}</span>
							{#if progress}
								<span class="inline-flex items-center font-bold ml-2">
									<ArrowUpIcon class="w-3 h-3" />
									<span>{Math.round(percent * 1000) / 10}%</span>
								</span>
							{/if}
						</div>
					</div>

					<div>
						{#if progress && percent < 1}
							<button
								type="button"
								class="btn btn-sm btn-circle btn-ghost"
								on:click|preventDefault={() => onCancelUpload(file)}
							>
								<CloseIcon class="w-4 h-4" />
							</button>
						{:else}
							<button
								type="button"
								class="btn btn-sm btn-circle btn-ghost"
								on:click|preventDefault={() => onRemoveFile(file)}
							>
								<DeleteBackIcon class="w-4 h-4" />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if canUpload}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="relative border-base-content/30 outline-4 outline-primary/10 group-focus-within:border-primary group-focus-within:outline hover:border-primary rounded-md"
			class:!border-primary={over}
			class:active={over}
			class:border={!ghost}
			class:shadow-sm={!ghost}
			class:p-2={!ghost}
			on:drop={onDrop}
			on:dragover={onDragOver}
			on:dragleave={onDragLeave}
			on:click|preventDefault={() => openFilePicker()}
		>
			{#if !ghost}
				<div class="mb-3 py-2">
					<div class="flex items-center gap-3">
						<div class="pt-1 w-14 flex justify-center">
							<UploadIcon class="w-6 h-6 opacity-40" />
						</div>

						<div class="flex-1">
							<div class="">{$_('text.drop_files_here')}</div>
						</div>
					</div>
				</div>

				<div class="flex justify-between border-t border-base-300 pt-3">
					<div class="text-xs opacity-60">
						{$_('text.max_file_size', { values: { size: formatBytes(maxFileSize) } })}
					</div>

					{#if encrypted}
						<div class="text-xs flex gap-2 items-center">
							<span class="opacity-60">{$_('text.files_e2e_encrypted')}</span>
							<ShieldIcon class="w-3 h-3 text-success" />
						</div>
					{/if}
				</div>
			{/if}

			<slot />

			<input
				type="file"
				{required}
				{multiple}
				class="absolute inset-0 w-full h-full cursor-pointer opacity-[0.01]"
				on:change={onFileInputChange}
			/>
		</div>
	{/if}

	<svelte:fragment slot="aside">
		{#if maxFiles && maxFiles > 1}
			<span class="text-xs whitespace-nowrap">{files.length} / {maxFiles}</span>
		{/if}
	</svelte:fragment>
</BaseInput>
