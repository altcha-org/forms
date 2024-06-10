<script lang="ts">
	import AuditlogTable from '$lib/components/AuditlogTable.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div>
	<AuditlogTable
		accountId={data.account.id}
		events={data.events}
		pagination={data.pagination}
		hideFormColumn
	/>
</div>
