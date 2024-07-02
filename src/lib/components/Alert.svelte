<script lang="ts">
	export let variant: 'warning' | 'primary' | 'success' = 'warning';
</script>

<div class="flex flex-wrap items-center gap-3 bg-{variant}/10 p-3 rounded-md text-sm">
	<div class="grow">
		<slot />
	</div>

	{#if $$slots.actions}
		<div class="flex gap-4">
			<slot name="actions" />
		</div>
	{/if}
</div>
