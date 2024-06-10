<script lang="ts">
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;

	$: text = block?.options?.text || '';
</script>

<div class="divider my-1">{text}</div>
