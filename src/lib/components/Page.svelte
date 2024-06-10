<script lang="ts">
	export let title: string | undefined = void 0;
</script>

<div class="max-w-4xl mx-auto px-3 py-6 lg:py-12 flex flex-col gap-4 lg:gap-6">
	{#if title}
		<div class="text-2xl font-bold">{title}</div>
	{/if}

	<slot />
</div>
