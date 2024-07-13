<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';

	export let value: string = '';

	$: html = renderMarkdown(value);
</script>

<!-- eslint-disable svelte/no-at-html-tags -->
{@html html}
