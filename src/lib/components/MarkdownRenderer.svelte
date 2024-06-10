<script lang="ts">
	import { renderMarkdown } from '$lib/markdown';

	export let value: string = '';

	$: html = renderMarkdown(value);
</script>

{@html html}
