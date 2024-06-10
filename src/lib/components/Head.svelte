<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeft.svelte';
	import type { ITab } from '$lib/types';

	export let backUrl: string = '';
	export let baseUrl: string = '';
	export let tabs: ITab[] = [];
</script>

<div class="bg-base-100 border-b-2 border-base-200 sticky top-8 z-40 pt-1">
	<div class="max-w-4xl mx-auto flex flex-col gap-1">
		{#if $$slots.breadcrumbs}
			<div class="flex items-center gap-2 px-3">
				{#if backUrl}
					<div class="-ml-8">
						<a href={backUrl} class="btn btn-xs btn-circle btn-ghost">
							<ArrowLeftIcon class="w-3 h-3" />
						</a>
					</div>
				{/if}

				<div class="text-sm breadcrumbs w-full overflow-hidden">
					<slot name="breadcrumbs" />
				</div>
			</div>
		{/if}

		<div class="px-3">
			<slot />
		</div>

		{#if tabs.length}
			<div class="mb-[-2px]">
				<Tabs {baseUrl} {tabs} />
			</div>
		{:else}
			<div class="h-1"></div>
		{/if}
	</div>
</div>
