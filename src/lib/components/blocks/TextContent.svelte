<script lang="ts">
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let preview: boolean = false;

	$: text = block.options?.text || (preview ? '...' : '');
</script>

<div class="prose max-w-full">
	<MarkdownRenderer value={text} />
</div>
