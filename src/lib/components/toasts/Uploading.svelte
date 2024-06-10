<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { uploadProgress } from '$lib/stores';

	$: uploadedFiles = $uploadProgress.filter(
		({ error, file, loaded }) => !error && file.size <= loaded
	);
	$: erroredFiles = $uploadProgress.filter(({ error }) => !!error);
	$: uploadedPercent =
		$uploadProgress.reduce((acc, { loaded }) => acc + loaded, 0) /
		$uploadProgress.reduce((acc, { file }) => acc + file.size, 0);
</script>

<div>
	{$_('text.uploading_files', {
		values: {
			progress: Math.round(uploadedPercent * 1000) / 10,
			total: $uploadProgress.length,
			count: $uploadProgress.length - (uploadedFiles.length + erroredFiles.length)
		}
	})}
</div>
