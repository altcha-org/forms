<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import UploadIcon from '$lib/components/icons/Upload.svelte';
	import ShieldIcon from '$lib/components/icons/Shield.svelte';
	import { formatBytes } from '$lib/format';
	import { uploadProgress } from '$lib/stores';
	import { matchesFileType, uploadFile } from '$lib/helpers';

	export let accept: string = 'image/*';
	export let ddover: boolean = false;
	export let encrypted: boolean = false;
	export let error: string | null = null;
	export let file: File | null = null;
	export let maxFileSize: number = 1024 * 1024 * 5;
	export let name: string | null = null;
	export let required: boolean = false;
	export let submitUrl: string = `${$page.url.pathname}/file`;
	export let value: string | null = null;

	const dispatch = createEventDispatcher();

	let elInput: HTMLInputElement;
	let elForm: HTMLFormElement | null;
	let previewUrl: string | null = null;

	$: uploaded = $uploadProgress.find((item) => item.file === file)?.loaded === file?.size;

	onDestroy(() => {
		elForm?.removeEventListener('submit', onFormSubmit);
		$uploadProgress = $uploadProgress.filter((p) => p.file !== file);
		file = null;
	});

	onMount(() => {
		elForm = elInput?.closest('form');
		elForm?.addEventListener('submit', onFormSubmit, {
			capture: true
		});
	});

	function addFile(f: File) {
		if (maxFileSize && f.size > maxFileSize) {
			error = $_('error.file_too_large', { values: { name: f.name } });
		} else if (!matchesFileType(accept, f)) {
			error = $_('error.file_type_not_allowed', { values: { name: f.name } });
		} else {
			error = null;
			file = f;
			previewUrl = URL.createObjectURL(file);
			elForm?.dispatchEvent(new Event('change'));
			dispatch('preview', { file, url: previewUrl });
		}
	}

	function onDragLeave() {
		if (ddover) {
			ddover = false;
		}
	}

	function onDragOver(ev: DragEvent) {
		ev.preventDefault();
		if (!ddover) {
			ddover = true;
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
						break;
					}
				}
			}
		}
		if (ddover) {
			ddover = false;
		}
	}

	function onFileInputChange(ev: Event & { currentTarget: HTMLInputElement }) {
		if (ev.currentTarget?.files) {
			for (let file of ev.currentTarget.files) {
				addFile(file);
			}
			ev.currentTarget.value = '';
		}
	}

	function onFormSubmit(ev: SubmitEvent) {
		if (file && !uploaded && submitUrl) {
			ev.preventDefault();
			ev.stopPropagation();
			uploadPendingFiles();
		}
	}

	async function uploadPendingFiles() {
		if (file) {
			const progress = $uploadProgress.find((item) => item.file === file);
			if (!progress) {
				const fileId = await uploadFile(file, submitUrl);
				if (fileId) {
					value = fileId;
					dispatch('upload', {
						file,
						fileId
					});
				}
			}
		}
		requestAnimationFrame(() => {
			elForm?.requestSubmit();
		});
	}
</script>

<input bind:this={elInput} type="hidden" {name} {value} />

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	class="grow flex flex-col relative"
	on:drop={onDrop}
	on:dragover={onDragOver}
	on:dragleave={onDragLeave}
>
	<slot {error} {file}>
		<div class="grow mb-3 py-2 flex flex-col items-center justify-center gap-3">
			<div>
				<UploadIcon class="w-6 h-6 opacity-40" />
			</div>

			<div>
				<div class="">{$_('text.drop_image_here')}</div>
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
	</slot>

	<input
		type="file"
		{accept}
		{required}
		class="absolute inset-0 w-full h-full cursor-pointer opacity-[0.01]"
		on:change={onFileInputChange}
	/>
</div>
