<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { page } from '$app/stores';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import FormUpload from '$lib/components/FormUpload.svelte';
	import { formatBytes } from '$lib/format';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		accept: string;
		maxFiles: string;
		maxFileSize: string;
	}>;
	export let encrypted: boolean = false;
	export let error: string | undefined = void 0;
	export let imagePreviews: [File, string][] = [];
	export let preview: boolean = false;
	export let submitUrl: string = `${$page.url.pathname}/file`;
	export let value: string | undefined = void 0;
	export let visible: boolean = true;

	const limitFileSize = getContext<number>('limitFileSize') || 10;

	let accept: string;
	let ddover: boolean = false;
	let files: File[] = [];
	let selectedFile: File | null = null;

	$: accept = block.options?.accept || 'image/*';
	$: maxFileSize =
		1024 * 1024 * Math.min(limitFileSize, parseInt(block.options?.maxFileSize || '10', 10));
	$: maxFiles = parseInt(block.options?.maxFiles || '0', 10);
	$: canUpload = !maxFiles || maxFiles > files.length;
	$: required = block.required && !preview && visible;

	function onImagePreview(file: File, url: string) {
		if (!preview) {
			files = [...files, file];
			imagePreviews = [...imagePreviews, [file, url]];
		}
		selectedFile = null;
	}

	function onRemove(file: File) {
		if (confirm($_('text.confirm_remove', { values: { name: file.name } }))) {
			files = files.filter((f) => f !== file);
		}
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<FormUpload {files} {submitUrl} let:value={fileIds}>
		<input
			type="hidden"
			name={block.name}
			value={Array.isArray(fileIds) ? fileIds.join(',') : fileIds}
		/>
	</FormUpload>

	<div class="grid xl:grid-cols-3 gap-6" class:!grid-cols-1={preview}>
		{#each files as file}
			{@const previewUrl = imagePreviews.find(([f]) => f === file)?.[1]}
			<div class="flex flex-col border border-base-content/30 shadow-sm rounded-md overflow-hidden">
				<div class="w-full relative">
					<img src={previewUrl} alt="" class="w-full h-32 object-cover bg-base-200" />
				</div>
				<div class="flex items-center gap-3 px-2 h-12">
					<div class="grow truncate">
						<div class="truncate">{file.name}</div>
						<div class="text-sm opacity-60">{formatBytes(file.size)}</div>
					</div>
					<div>
						<button
							type="button"
							class="btn btn-sm btn-circle btn-ghost"
							on:click={() => onRemove(file)}
						>
							<DeleteBackIcon class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		{/each}

		{#if canUpload}
			<div
				class="h-44 flex flex-col border border-base-content/30 shadow-sm outline-4 outline-primary/10 group-focus-within:border-primary group-focus-within:outline hover:border-primary cursor-pointer rounded-md p-2"
				class:!border-primary={ddover}
				class:active={ddover}
				aria-required={required}
			>
				<ImageUpload
					{accept}
					{encrypted}
					{maxFileSize}
					{required}
					{submitUrl}
					bind:ddover
					bind:error
					bind:file={selectedFile}
					on:preview={(ev) => onImagePreview(ev.detail.file, ev.detail.url)}
				/>
			</div>
		{/if}
	</div>
</BaseInput>
