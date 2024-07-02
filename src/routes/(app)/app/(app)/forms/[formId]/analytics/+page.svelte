<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { parseISO } from 'date-fns';
	import BarChart from '$lib/components/BarChart.svelte';
	import BarChartVertical from '$lib/components/BarChartVertical.svelte';
	import PHONE_CODES from '$lib/phone-codes';
	import { formatDate, formatDuration, formatNumber } from '$lib/format';
	import type { PageData } from './$types';

	export let data: PageData;

	$: stats = data.stats;

	$: abandonmentRate = Math.floor((1 - (stats.summary.submissions / stats.summary.views)) * 1000) / 10;
	$: correctionRate = stats.summary.submissions ? Math.floor((stats.summary.correctionRate || 0) * 1000) / 10 : null;
	$: errorRate = Math.floor((stats.summary.errored / stats.summary.views) * 1000) / 10;
	$: countries = Object.entries(stats.countries).map(([ code, value ]) => {
		const codeUppercase = code.toUpperCase();
		const country = PHONE_CODES.find((c) => c.code.toLowerCase() === code);
		const name = country?.name || codeUppercase;
		return {
			label: `${country?.emoji || ''} ${name} (${codeUppercase})`,
			value: [value],
		}
	});
	$: devices = stats.summary.views ? [{
		label: $_('label.mobile'),
		value: [stats.summary.mobile],
	}, {
		label: $_('label.desktop'),
		value: [stats.summary.views - stats.summary.mobile],
	}] : [];
	$: views = stats.views.map(({ label, value }) => ({ label: formatDate(parseISO(label)), value }));
</script>

<div class="flex flex-col gap-8">
	<div class="grid lg:grid-cols-3 gap-3">
		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.views')}</div>
			<div>
				<span class="font-bold text-xl">{formatNumber(stats.summary.views)}</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.responses')}</div>
			<div>
				<span class="font-bold text-xl">{formatNumber(stats.summary.submissions)}</span>
			</div>
		</div>

		<div class="border border-base-300 rounded-lg p-3 shadow-sm">
			<div>{$_('label.completion_time')}</div>
			<div>
				<span class="font-bold text-xl">
					{#if stats.summary.completionTime > 0}
						{@const time = formatDuration(stats.summary.completionTime)}
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
		<BarChartVertical
      items={views}
      legend={[$_('label.views'), $_('label.responses')]}
      wide
    />
	</div>

	<div class="grid lg:grid-cols-2 gap-6 lg:gap-12">
		<div class="flex flex-col gap-3">
			<div class="font-bold">{$_('label.countries')}</div>
			<BarChart items={countries} maxRows={10} />
		</div>

    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-3">
        <div class="font-bold">{$_('label.field_drop_off')}</div>
        <BarChart items={stats.fieldDropOff} maxRows={10} />
      </div>

      <div class="flex flex-col gap-3">
        <div class="font-bold">{$_('label.devices')}</div>
        <BarChart items={devices} />
      </div>
    </div>

	</div>
</div>
