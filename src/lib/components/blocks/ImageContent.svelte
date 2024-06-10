<script lang="ts">
	import type { IFormBlockPartial } from '$lib/types';
	import ImageIcon from '$lib/components/icons/Image.svelte';

	export let block: IFormBlockPartial;
	export let preview: boolean = false;

	$: src = block?.options?.src || '';
	$: maxWidth = block?.options?.max_width || '';
</script>

<div>
	{#if src}
		<img {src} alt="" style={maxWidth ? `max-width:${maxWidth}` : ''} />
	{:else if preview}
		<ImageIcon class="w-6 h-6 opacity-60" />
	{/if}
</div>
