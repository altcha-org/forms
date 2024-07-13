<script lang="ts">
	import List from '$lib/components/List.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: items = Object.entries(data.response.context).sort(([a], [b]) => a.localeCompare(b));
</script>

<List {items} />
