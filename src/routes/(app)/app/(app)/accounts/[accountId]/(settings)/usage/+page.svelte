<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import List from '$lib/components/List.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { formatDate, formatNumber } from '$lib/format';
	import { camelToSnakeCase } from '$lib/helpers';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import Form from '$lib/components/Form.svelte';
	import BarChart from '$lib/components/BarChart.svelte';
	import type { PageData } from './$types';
	import BarChartVertical from '$lib/components/BarChartVertical.svelte';

	interface IApiKeyUsage {
		classifications: Record<string, number>;
		days: { date: string; requests: number }[];
		referrers: Record<string, number>;
		requests: number;
	}

	export let data: PageData;

	const months = getMonths();

	let apiKeyUsage: IApiKeyUsage | null = null;
	let month: string | null = $page.url.searchParams.get('month') || dateToMonthString(months[0]);

	$: plan = data.account.plan;
	$: limits = Object.entries(plan || {})
		.filter(([key]) => key.startsWith('limit'))
		.filter((item) => data.usage[item[0]] !== void 0) as [string, number][];
	$: monthOptions = months.map((date) => {
		return {
			label: formatDate(date, void 0, void 0, {
				month: 'long',
				year: 'numeric'
			}),
			value: dateToMonthString(date)
		};
	});

	function getMonths() {
		const now = new Date();
		now.setDate(1);
		return [
			now,
			getDateForMonth(now.getFullYear(), now.getMonth() - 1),
			getDateForMonth(now.getFullYear(), now.getMonth() - 2)
		];
	}

	function getDateForMonth(year: number, month: number) {
		const date = new Date();
		date.setFullYear(year);
		date.setMonth(month);
		date.setDate(1);
		return date;
	}

	function dateToMonthString(date: Date) {
		return date.toISOString().split('T')[0].slice(0, -3);
	}

	function onLoadApiKeyUsageSubmit(result: { result: { data: IApiKeyUsage | null } }) {
		apiKeyUsage = result.result.data;
	}

	function onMonthChange() {
		apiKeyUsage = null;
		const url = new URL($page.url);
		url.searchParams.set('month', month || '');
		goto(url);
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<div class="text-xl">{$_('label.usage')}</div>

		<div class="prose">
			<MarkdownRenderer value={$_('text.account_usage')} />
		</div>

		<div class="mb-3">
			<SelectInput
				block={{
					name: 'month',
					options: {
						options: monthOptions
					},
					size: 'sm'
				}}
				hideLabel
				bind:value={month}
				on:change={() => onMonthChange()}
			/>
		</div>

		<div class="grid xl:grid-cols-2 gap-12">
			<div>
				<div class="font-bold mb-3">{$_('label.account_usage')}</div>

				<List items={limits} let:item>
					<div class="text-sm">{$_(camelToSnakeCase(item[0]).replace('limit_', 'limit.'))}</div>

					{#if data.usage[item[0]] !== void 0}
						{@const limit = +item[1]}
						{@const used = data.usage[item[0]]}
						<div class="flex items-center gap-3">
							<progress class="progress progress-primary" value={used} max={limit}></progress>
							<div class="text-sm whitespace-nowrap">
								{formatNumber(used)} / {formatNumber(limit)}
							</div>
						</div>
					{:else if typeof item[1] === 'number'}
						<div class="text-sm">{formatNumber(item[1])}</div>
					{:else}
						<div class="text-sm">{item[1]}</div>
					{/if}

					{#if item[0] === 'limitApi'}
						<div class="mt-3">
							<BarChartVertical
								items={data.days.map(({ date, requests }) => ({ label: date, value: [requests] }))}
							/>
						</div>
					{/if}
				</List>
			</div>

			<div>
				<div class="font-bold mb-3">{$_('label.api_keys')}</div>

				<div class="flex flex-col gap-6">
					<Form
						action="?/loadApiKeyUsage"
						data={{
							month
						}}
						successToast={false}
						on:submit={(ev) => onLoadApiKeyUsageSubmit(ev.detail)}
						let:loading
					>
						<div class="flex flex-col gap-3">
							<SelectInput
								block={{
									name: 'apiKeyId',
									placeholder: $_('placeholder.select'),
									required: true,
									options: {
										options: data.apiKeys.map((apiKey) => {
											return {
												label: apiKey.name,
												value: apiKey.id
											};
										})
									},
									size: 'md'
								}}
								hideLabel
							/>

							<div>
								<button type="submit" class="btn btn-sm btn-primary" disabled={loading}
									>{$_('button.show_usage')}</button
								>
							</div>
						</div>
					</Form>

					{#if apiKeyUsage?.requests !== void 0}
						<div class="border border-base-300 rounded-md p-4">
							<div class="flex gap-3 mb-3 text-sm">
								<div class="grow">{$_('limit.api')}</div>
								<div>{formatNumber(apiKeyUsage.requests)}</div>
							</div>
							{#if apiKeyUsage?.days}
								<BarChartVertical
									items={apiKeyUsage.days.map(({ date, requests }) => ({
										label: date,
										value: [requests]
									}))}
								/>
							{/if}
						</div>
					{/if}

					{#if apiKeyUsage?.referrers}
						<div class="border border-base-300 rounded-md p-4">
							<div class="mb-2 text-sm">{$_('label.referrers')}</div>
							<BarChart items={apiKeyUsage.referrers} />
						</div>
					{/if}

					{#if apiKeyUsage?.classifications}
						<div class="border border-base-300 rounded-md p-4">
							<div class="mb-2 text-sm">{$_('label.classifications')}</div>
							<BarChart items={apiKeyUsage?.requests > 0 ? apiKeyUsage.classifications : {}} />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-2"></div>
</div>
