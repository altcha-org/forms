<script lang="ts">
	import PdfCanvas from '$lib/components/PdfCanvas.svelte';

	let files: File[] | null = null;
</script>

<div class="p-3">
	<div class="flex gap-6">
		<div class="grow">
			{#if files}
				<PdfCanvas file={files[0]} />
			{:else}
				<input type="file" bind:files />
			{/if}
		</div>
	</div>
</div>
