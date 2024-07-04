<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { uploadFile } from '$lib/helpers';
	import { uploadProgress } from '$lib/stores';

	export let files: File[];
	export let submitUrl: string = `${$page.url.pathname}/file`;
	export let value: string[] = [];

	let el: HTMLElement;
	let elForm: HTMLFormElement | null = null;

	$: progress = $uploadProgress.filter((item) => files.includes(item.file));
	$: uploaded =
		progress.length === files.length && progress.every(({ file, loaded }) => file.size <= loaded);
	$: hasPendingFiles = progress.length < files.length;

	onDestroy(() => {
		elForm?.removeEventListener('submit', onFormSubmit);
		$uploadProgress = $uploadProgress.filter((p) => !files.includes(p.file));
		files = [];
	});

	onMount(() => {
		elForm = el?.closest('form');
		elForm?.addEventListener('submit', onFormSubmit, {
			capture: true
		});
	});

	function onFormSubmit(ev: SubmitEvent) {
		if (files.length && submitUrl && !uploaded) {
			ev.preventDefault();
			ev.stopPropagation();
			if (hasPendingFiles) {
				uploadPendingFiles();
			}
		}
	}

	async function uploadPendingFiles() {
		try {
			for (let file of files) {
				const progress = $uploadProgress.find((item) => item.file === file);
				if (!progress) {
					const fileId = await uploadFile(file, submitUrl);
					if (fileId) {
						value = [...value, fileId];
					}
				}
			}
			requestAnimationFrame(() => {
				elForm?.requestSubmit();
			});
		} catch (err) {
			elForm?.dispatchEvent(
				new CustomEvent('error', {
					detail: err
				})
			);
		}
	}
</script>

<div bind:this={el}>
	<slot {value} />
</div>
