<script lang="ts">
	import { _ } from 'svelte-i18n';
	import List from '$lib/components/List.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { formatNumber } from '$lib/format';
	import { camelToSnakeCase } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	$: plan = data.account.plan;
	$: limits = Object.entries(plan || {})
		.filter(([key]) => key.startsWith('limit'))
		.filter((item) => data.usage[item[0]] !== void 0);
</script>

<div class="flex flex-col gap-6">
	<div>
		<div class="text-xl">{$_('title.current_plan')}</div>
		<div class="font-bold text-xl">{plan?.name || $_('text.no_plan')}</div>
		<div>
			<a href="/app/accounts/{data.account.id}/billing" class="link text-sm"
				>{$_('button.change')}</a
			>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<div class="text-xl">{$_('label.usage')}</div>

		<div class="grid xl:grid-cols-2 gap-6">
			<div>
				<List items={limits} let:item>
					<div class="text-sm">{$_(camelToSnakeCase(item[0]).replace('limit_', 'limit.'))}</div>

					{#if data.usage[item[0]] !== void 0}
						{@const limit = +item[1]}
						{@const used = data.usage[item[0]]}
						<div class="flex items-center gap-3">
							<progress class="progress" value={used} max={limit}></progress>
							<div class="text-sm whitespace-nowrap">
								{formatNumber(used)} / {formatNumber(limit)}
							</div>
						</div>
					{:else if typeof item[1] === 'number'}
						<div class="text-sm">{formatNumber(item[1])}</div>
					{:else}
						<div class="text-sm">{item[1]}</div>
					{/if}
				</List>
			</div>

			<div class="prose">
				<MarkdownRenderer value={$_('text.account_usage')} />
			</div>
		</div>
	</div>
</div>
