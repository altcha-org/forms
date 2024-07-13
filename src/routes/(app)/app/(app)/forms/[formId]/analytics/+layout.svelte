<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { _ } from 'svelte-i18n';
	import { endOfDay, startOfDay, parseISO, startOfMonth, endOfMonth } from 'date-fns';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatDate } from '$lib/format';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import Tabs from '$lib/components/Tabs.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import DateTimeInput from '$lib/components/blocks/DateTimeInput.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	const intervals = ['last_30_days', 'this_month', 'last_month', 'custom'] as const;
	const allResponses = writable<boolean>(false);
	const presets = getLastMonths();

	setContext('allResponses', allResponses);

	let customDateModalOpen: boolean = false;
	let endDate = new Date($page.url.searchParams.get('end') || '');
	let startDate = new Date($page.url.searchParams.get('start') || '');
	let interval: (typeof intervals)[number] = getMatchingInterval();
	let customStartDate = toLocaleDate(startDate);
	let customEndDate = toLocaleDate(endDate);

	$: demo = $page.url.searchParams.get('demo') === '1';
	$: customDays =
		(parseISO(customEndDate).getTime() - parseISO(customStartDate).getTime()) / 86400000;
	$: tab = $page.url.pathname.match(/\/analytics\/([^/]+)/)?.[1];
	$: allowAll = tab === 'responses';

	function getMatchingInterval(): (typeof intervals)[number] {
		for (const int of intervals) {
			const dates = getIntervalDates(int);
			if (
				dates.end.getTime() === endDate.getTime() &&
				dates.start.getTime() === startDate.getTime()
			) {
				return int;
			}
		}
		return 'custom';
	}

	function getIntervalDates(int: typeof interval) {
		const now = new Date();
		let start = new Date();
		let end = new Date();
		switch (int) {
			case 'last_30_days':
				start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
				break;
			case 'this_month':
				start = new Date(now.getFullYear(), now.getMonth(), 1);
				end = new Date(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1);
				break;
			case 'last_month':
				start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				end = new Date(new Date(now.getFullYear(), now.getMonth(), 1).getTime() - 1);
				break;
			default:
		}
		return {
			end: endOfDay(end),
			start: startOfDay(start)
		};
	}

	function getLastMonths(months: number = 6) {
		const now = new Date();
		return [...Array(months)]
			.map((_, i) => {
				const date = new Date(now.getFullYear(), now.getMonth() - i);
				return {
					end: endOfMonth(date),
					start: startOfMonth(date),
					formatted: formatDate(date, void 0, void 0, {
						month: 'short',
						year: 'numeric'
					})
				};
			})
			.reverse();
	}

	function onCustomDateSubmit(formData: FormData) {
		const start = startOfDay(parseISO(String(formData.get('start'))));
		const end = endOfDay(parseISO(String(formData.get('end'))));
		setDates(start, end);
	}

	function onIntervalChange() {
		if (interval === 'custom') {
			customDateModalOpen = true;
		} else {
			const { end, start } = getIntervalDates(interval);
			setDates(start, end);
		}
	}

	function onPreset(preset: (typeof presets)[number]) {
		customStartDate = toLocaleDate(preset.start);
		customEndDate = toLocaleDate(preset.end);
	}

	function setDates(start: Date, end: Date) {
		const url = new URL(`/app/forms/${data.form.id}/analytics/${tab || ''}`, location.origin);
		url.searchParams.set('end', end.toISOString());
		url.searchParams.set('start', start.toISOString());
		goto(url, {
			invalidateAll: true
		});
	}

	function showDemo() {
		const url = new URL($page.url);
		url.searchParams.set('demo', '1');
		goto(url, {
			invalidateAll: true
		});
	}

	function toLocaleDate(date: Date) {
		return new Date(date.toLocaleDateString()).toISOString().split('T')[0];
	}
</script>

{#if !data.analyticsEnabled && !demo}
	<div class="flex flex-col gap-3">
		<Alert>
			{$_('text.analytics_not_enabled_for_plan')}

			<svelte:fragment slot="actions">
				<button type="button" class="link" on:click={() => showDemo()}
					>{$_('button.show_demo')}</button
				>
				<a href="/app/accounts/{data.account.id}/billing" class="link">{$_('button.upgrade')}</a>
			</svelte:fragment>
		</Alert>
	</div>
{:else}
	{#if demo}
		<Alert variant="warning">
			{$_('text.viewing_demo_data')}
		</Alert>
	{/if}

	<div class="bg-base-200/50 flex flex-wrap items-center gap-3 p-3 pl-1 rounded-lg">
		<div class="grow">
			<div class="px-3 text-lg font-bold">
				{$_('title.analytics')}
			</div>
			<Tabs
				baseUrl={`/app/forms/${data.form.id}/analytics`}
				tabs={[
					{
						label: $_('label.overview'),
						href: `/${$page.url.search}`
					},
					{
						disabled: demo,
						label: $_('label.responses'),
						href: `/responses${$page.url.search}`
					}
				]}
			/>
		</div>

		<div class="grow flex flex-col items-end gap-2">
			<div class="w-56">
				<SelectInput
					block={{
						name: '',
						options: {
							options: intervals.map((interval) => {
								return {
									label: $_('interval.' + interval),
									value: interval
								};
							})
						}
					}}
					disabled={$allResponses || demo}
					bind:value={interval}
					on:change={() => onIntervalChange()}
				/>
			</div>

			<div class="text-sm flex gap-4 items-center justify-end">
				<div class="whitespace-nowrap opacity-60">
					{#if !$allResponses}
						<span>{formatDate(data.start)}</span>
						<span>&mdash;</span>
						<span>{formatDate(data.end)}</span>
						{#if interval === 'custom'}
							<button
								type="button"
								class="link ml-1"
								on:click|preventDefault={() => onIntervalChange()}>{$_('button.change')}</button
							>
						{/if}
					{/if}
				</div>

				{#if allowAll}
					<label class="flex items-center gap-2">
						<input
							type="checkbox"
							class="checkbox checkbox-xs bg-base-100"
							bind:checked={$allResponses}
						/>
						<span class="whitespace-nowrap">{$_('label.all_responses')}</span>
					</label>
				{/if}
			</div>
		</div>
	</div>

	<div>
		<slot />
	</div>

	<Modal
		action=""
		title={$_('title.custom_date')}
		disabled={customDays < 1 || customDays > 31}
		buttonLabel={$_('button.apply')}
		bind:open={customDateModalOpen}
		on:submit={(ev) => onCustomDateSubmit(ev.detail.data)}
	>
		<div class="flex flex-col gap-6">
			<DateTimeInput
				block={{
					label: $_('label.start_date'),
					name: 'start',
					required: true
				}}
				bind:value={customStartDate}
			/>

			<DateTimeInput
				block={{
					label: $_('label.end_date'),
					name: 'end',
					required: true
				}}
				bind:value={customEndDate}
			/>

			{#if customDays < 1}
				<Alert variant="warning">
					{$_('text.date_range_invalid')}
				</Alert>
			{:else if customDays > 31}
				<Alert variant="warning">
					{$_('text.date_range_max_days')}
				</Alert>
			{/if}

			<div class="flex flex-wrap gap-3 text-sm">
				{#each presets as preset}
					<button type="button" class="link" on:click|preventDefault={() => onPreset(preset)}>
						{preset.formatted}
					</button>
				{/each}
			</div>
		</div>
	</Modal>
{/if}
