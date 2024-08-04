<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { parseISO } from 'date-fns';
	import BarChart from '$lib/components/BarChart.svelte';
	import BarChartVertical from '$lib/components/BarChartVertical.svelte';
	import PHONE_CODES from '$lib/phone-codes';
	import { formatDate, formatDuration, formatNumber } from '$lib/format';
	import type { PageData } from './$types';
	import type { IFormBlockPartial } from '$lib/types';

	export let data: PageData;

	$: blocks = data.form.steps.reduce((acc, step) => {
		for (const block of step.blocks) {
			acc.push(block);
		}
		return acc;
	}, [] as IFormBlockPartial[]);
	$: stats = data.stats;
	$: summary = {
		completionTime: Math.floor(
			stats.reduce((acc, { values }) => acc + (values.completionTime || 0), 0) /
				stats.filter(({ values }) => !!values.completionTime).length
		),
		correctionRate:
			stats.reduce((acc, { values }) => {
				return acc + (values.correctionRate || 0);
			}, 0) / stats.filter(({ values }) => values.correctionRate !== null).length,
		errored: stats.reduce((acc, { values }) => {
			return acc + values.errored;
		}, 0),
		mobile: stats.reduce((acc, { values }) => {
			return acc + values.mobile;
		}, 0),
		submissions: stats.reduce((acc, { values }) => acc + values.submissions, 0),
		views: stats.reduce((acc, { values }) => acc + values.views, 0)
	};
	$: abandonmentRate =
		Math.floor((1 - summary.submissions / (summary.views - summary.errored)) * 1000) / 10;
	$: correctionRate = summary.views ? Math.floor((summary.correctionRate || 0) * 1000) / 10 : null;
	$: errorRate = Math.floor((summary.errored / summary.views) * 1000) / 10;
	$: countries = stats.reduce(
		(acc, { values }) => {
			for (const code in values.countries) {
				const codeUppercase = code.toUpperCase();
				const country = PHONE_CODES.find((c) => c.code.toLowerCase() === code);
				const name = country?.name || codeUppercase;
				const label = `${country?.emoji || ''} ${name} (${codeUppercase})`;
				acc[label] = (acc[label] || 0) + values.countries[code];
			}
			return acc;
		},
		{} as Record<string, number>
	);
	$: fieldDropOff = stats.reduce(
		(acc, { values }) => {
			if (values.fieldDropOff) {
				for (const name in values.fieldDropOff) {
					const block = blocks.find((b) => b.name === name);
					const blockLabel = block?.label || name;
					acc[blockLabel] = (acc[blockLabel] || 0) + values.fieldDropOff[name];
				}
			}
			return acc;
		},
		{} as Record<string, number>
	);
	$: devices = summary.views
		? [
				{
					label: $_('label.mobile'),
					value: [summary.mobile]
				},
				{
					label: $_('label.desktop'),
					value: [summary.views - summary.mobile]
				}
			]
		: [];
	$: views = stats.map(({ label, values }) => ({
		label: formatDate(parseISO(label)),
		value: [values.views, values.submissions]
	}));
</script>

<div class="flex flex-col gap-8">
	<div class="grid lg:grid-cols-3 gap-3">
		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.views')}</div>
			<div>
				<span class="font-bold text-xl">{formatNumber(summary.views)}</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.responses')}</div>
			<div>
				<span class="font-bold text-xl">{formatNumber(summary.submissions)}</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.completion_time')}</div>
			<div>
				<span class="font-bold text-xl">
					{#if summary.completionTime > 0}
						{@const time = formatDuration(summary.completionTime)}
						{time.startsWith('00:') ? time.slice(3) : time}
					{:else}
						&mdash;
					{/if}
				</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.abandonment_rate')}</div>
			<div>
				<span class="font-bold text-xl">
					{#if isNaN(abandonmentRate)}
						&mdash;
					{:else}
						{abandonmentRate} %
					{/if}
				</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.correction_rate')}</div>
			<div>
				<span class="font-bold text-xl">
					{#if correctionRate === null || isNaN(correctionRate)}
						&mdash;
					{:else}
						{correctionRate} %
					{/if}
				</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.error_rate')}</div>
			<div>
				<span class="font-bold text-xl">
					{#if isNaN(errorRate)}
						&mdash;
					{:else}
						{errorRate} %
					{/if}
				</span>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<div class="font-bold">{$_('label.views_and_responses')}</div>
		<BarChartVertical items={views} legend={[$_('label.views'), $_('label.responses')]} wide />
	</div>

	<div class="grid lg:grid-cols-2 gap-6 lg:gap-12">
		<div class="flex flex-col gap-3">
			<div class="font-bold">{$_('label.countries')}</div>
			<BarChart items={countries} maxRows={10} />
		</div>

		<div class="flex flex-col gap-5">
			<div class="flex flex-col gap-3">
				<div class="font-bold">{$_('label.field_drop_off')}</div>
				<BarChart items={fieldDropOff} maxRows={10} />
			</div>

			<div class="flex flex-col gap-3">
				<div class="font-bold">{$_('label.devices')}</div>
				<BarChart items={devices} />
			</div>
		</div>
	</div>
</div>
