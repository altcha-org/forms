<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatDateTime } from '$lib/format';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: records = data.response.logs;
</script>

<div class="border border-base-300 rounded-md">
	{#if records.length === 0}
		<div class="opacity-60 italic p-3">
			{$_('text.no_records')}
		</div>
	{/if}

	<div class="p-3">
		<ul class="timeline timeline-snap-icon timeline-compact timeline-vertical">
			{#each records as { data, error, text, time }, i}
				<li class="">
					{#if i > 0}
						<hr />
					{/if}
					<div class="timeline-middle">
						{#if error}
							<div
								class="flex items-center justify-center w-5 h-5 rounded-full border border-error text-error"
							>
								<AlertIcon class="w-3 h-3" />
							</div>
						{:else}
							<div
								class="flex items-center justify-center w-5 h-5 rounded-full border border-base-300"
							></div>
						{/if}
					</div>
					<div class="timeline-start pl-2">
						<div class="text-xs opacity-70 pt-1.5">
							{formatDateTime(time, void 0, void 0, {
								timeStyle: 'medium'
							})}
						</div>
						<div>
							{text}
						</div>
					</div>
					{#if i < records.length - 1}
						<hr />
					{/if}
				</li>
			{/each}
		</ul>
	</div>
</div>
