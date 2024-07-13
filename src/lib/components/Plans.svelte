<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { formatBytes, formatPrice } from '$lib/format';
	import { formatNumber } from '$lib/format';
	import { camelToSnakeCase, getTimeZone } from '$lib/helpers';
	import type { IPlan } from '$lib/types';
	import type { Record } from '@sinclair/typebox';

	export let billingCycle: 'month' | 'year' = 'year';
	export let plans: IPlan[];
	export let value: string | undefined = void 0;

	let currency: string = '';

	$: plansWithPrices = plans
		.filter(({ prices }) => prices.length > 0)
		.sort((a, b) => {
			return a.prices[0].amount > b.prices[0].amount ? 1 : -1;
		}) as Array<IPlan & Record<string, number>>;
	$: groupedPrices = plansWithPrices.reduce(
		(acc, plan) => {
			const group = plan.group || '';
			if (!acc[group]) {
				acc[group] = [];
			}
			acc[group].push(plan);
			return acc;
		},
		{} as Record<string, Array<IPlan & Record<string, number>>>
	);
	$: currencies = new Set<string>(
		plans.map(({ prices }) => prices.map(({ currency }) => currency)).flat()
	);
	$: periods = new Set<string>(
		plans.map(({ prices }) => prices.map(({ period }) => period)).flat()
	);

	onMount(() => {
		const defaultCurrency = getDefaultCurrency();
		if (currencies.has(defaultCurrency)) {
			currency = defaultCurrency;
		} else {
			currency = [...currencies][0];
		}
	});

	function formatLimit(value: number, key: string) {
		if (key === 'limitFileSize') {
			return formatBytes(value * 1024 * 1024);
		}
		return value >= 0 ? formatNumber(value) : $_('label.unlimited');
	}

	function getDefaultCurrency() {
		const tz = getTimeZone();
		if (tz?.startsWith('America/')) {
			return 'USD';
		} else if (tz === 'Europe/London') {
			return 'GBP';
		}
		return 'EUR';
	}
</script>

<div class="flex flex-wrap gap-6 mb-3">
	{#if periods.size === 2}
		<div class="">
			<div role="tablist" class="tabs tabs-boxed tabs-sm inline-flex">
				<button
					role="tab"
					class="tab"
					class:tab-active={billingCycle === 'month'}
					on:click|preventDefault={() => (billingCycle = 'month')}
					>{$_('label.monthly')}
				</button>
				<button
					role="tab"
					class="tab"
					class:tab-active={billingCycle === 'year'}
					on:click|preventDefault={() => (billingCycle = 'year')}
					>{$_('label.annually')}
				</button>
			</div>
		</div>
	{/if}

	{#if currencies.size > 1}
		<div class="flex items-center gap-2">
			<span class="opacity-60">{$_('label.currency')}:</span>
			<select class="select select-sm select-ghost" bind:value={currency}>
				{#each currencies as curr}
					<option value={curr}>{curr}</option>
				{/each}
			</select>
		</div>
	{/if}
</div>

{#each Object.entries(groupedPrices) as [group, plans]}
	<div class="mb-6">
		<div class="text-lg font-bold mb-3">{$_('text.plan_group_' + group)}</div>

		<div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
			{#each plans as plan}
				{@const selected = plan.id === value}
				{@const price = plan.prices.find(
					(p) => p.currency === currency && p.period === billingCycle
				)}
				<div
					class="grow flex flex-col gap-6 bg-base-100 border-2 rounded-xl p-3 min-w-52"
					class:max-w-72={plans.length === 1}
					class:border-primary={selected}
					class:shadow-lg={selected}
				>
					<div class="text-xl" class:font-bold={selected}>{plan.name}</div>

					<div>
						<div class="text-sm opacity-60">{$_('label.price')}</div>
						{#if price}
							<div>
								<b>{formatPrice(price.amount, currency)}</b> / {$_('period.month')}
							</div>
						{:else}
							<div class="italic">{$_('text.unavailable')}</div>
						{/if}
					</div>

					<div class="grow">
						<div class="text-sm opacity-60">{$_('label.limits')}</div>
						{#each Object.keys(plan) as key}
							{#if key.startsWith('limit')}
								{@const limitValue = plan[key]}
								{@const limitFormatted = formatLimit(limitValue, key)}
								<div class="text-sm">
									<div class="flex items-center gap-2">
										<div class="grow">{$_(camelToSnakeCase(key).replace('limit_', 'limit.'))}:</div>
										<div class:opacity-40={limitValue === 0}>
											{limitValue === 0 ? '—' : limitFormatted}
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>

					<div class="">
						<slot name="button" {plan} {price} selected={value} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/each}
