<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { PageData } from './$types';
	import List from '$lib/components/List.svelte';

	export let data: PageData;

	$: items = Object.entries(data.response.context).sort(([a], [b]) => a.localeCompare(b));
</script>

<List {items} />
