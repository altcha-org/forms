<script lang="ts">
	import { _ } from 'svelte-i18n';
	import List from '$lib/components/List.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: identity = data.identity;
</script>

<List
	items={[
		[$_('label.id'), identity?.id],
		[$_('label.external_id'), identity?.externalId]
	]}
/>

<div></div>
