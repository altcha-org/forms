<script lang="ts">
	import '../../../../app.scss';
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		initializePaddle,
		type Paddle,
		type CheckoutEventsTotals,
		type CheckoutEventsItem
	} from '@paddle/paddle-js';
	import { formatPrice } from '$lib/format';
	import LockIcon from '$lib/components/icons/Lock.svelte';
	import InformationIcon from '$lib/components/icons/Information.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let currency: string = 'EUR';
	let error: string | null = null;
	let items: CheckoutEventsItem[] = [];
	let loading: boolean = false;
	let paddle: Paddle | null = null;
	let totals: CheckoutEventsTotals | null = null;
	let updatePaymentMethod: boolean = false;

	onMount(() => {
		loading = true;
		error = null;
		initializePaddle({
			// @ts-ignore
			environment: data.paddleEnv,
			token: data.paddleClientToken,
			checkout: {
				settings: {
					displayMode: 'inline',
					frameTarget: 'checkout-container',
					frameInitialHeight: 450,
					frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;'
				}
			},
			eventCallback(ev) {
				const { account_id } = (ev.data?.custom_data || {}) as { account_id?: string };
				console.log(ev);
				switch (ev.name || ev.type) {
					case 'checkout.error':
						loading = false;
						error = ev.detail || 'error';
						break;
					case 'checkout.completed':
						if (account_id) {
							setTimeout(() => {
								goto(`/app/accounts/${account_id}/billing?subscription_created=1`);
							}, 5000);
						}
						break;
					case 'checkout.loaded':
						loading = false;
					default:
						if (ev.data?.status && ev.data?.totals) {
							updatePaymentMethod = ev.data.status === 'ready';
							currency = ev.data.currency_code;
							items = ev.data.items;
							totals = ev.data.totals;
						}
				}
			}
		})
			.then((instance) => (instance ? (paddle = instance) : null))
			.then(() => {
				if (paddle) {
					paddle.Checkout.open({
						settings: {
							showAddTaxId: true,
							showAddDiscounts: true
						},
						transactionId: data.transactionId
					});
				}
			})
			.catch(() => {});
	});
</script>

<div class="grid xl:grid-cols-2 gap-12 items-start">
	<div class="border border-base-300 bg-white shadow-sm rounded-md p-1">
		<div class="checkout-container min-w-72"></div>
	</div>

	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-6 border border-base-300 shadow-sm rounded-md p-3">
			{#if loading}
				<div>
					{$_('text.loading')}
				</div>
			{:else if error}
				<div>
					{$_('error.checkout_error')}
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					{#each items as item}
						{@const totals = item.recurring_totals || item.totals}
						<div>
							<div class="flex">
								<div class="grow">{item.product.name}</div>
								<div class="">
									{formatPrice(totals.subtotal, currency)}
									{#if item.billing_cycle}
										<span>/ {$_('period.' + item.billing_cycle.interval)}</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}

					{#if totals}
						{#if totals.tax}
							<div class="border-t border-base-200 pt-3">
								<div class="flex">
									<div class="grow">{$_('label.tax')}</div>
									<div>{formatPrice(totals.tax, currency)}</div>
								</div>
							</div>
						{/if}

						{#if totals.discount}
							<div class="border-t border-base-200 pt-3">
								<div class="flex">
									<div class="grow">{$_('label.discount')}</div>
									<div>{formatPrice(totals.discount * -1, currency)}</div>
								</div>
							</div>
						{/if}

						<div class="border-t border-base-200 pt-3">
							<div class="flex">
								<div class="font-bold grow">{$_('label.due_today')}</div>
								<div class="font-bold">{formatPrice(totals.total, currency)}</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex gap-3 px-3">
			<div class="pt-0.5">
				<InformationIcon class="w-4 h-4 opacity-60" />
			</div>
			<div>
				<p class="text-sm opacity-60">{$_('text.checkout_vat_info')}</p>
			</div>
		</div>

		<div class="flex gap-3 px-3">
			<div class="pt-0.5">
				<LockIcon class="w-4 h-4 text-success" />
			</div>
			<div>
				<p class="text-sm opacity-60">{$_('text.checkout_security_info')}</p>
			</div>
		</div>
	</div>
</div>
