<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import Alert from '$lib/components/Alert.svelte';
	import List from '$lib/components/List.svelte';
	import Plans from '$lib/components/Plans.svelte';
	import Form from '$lib/components/Form.svelte';
	import ExternalIcon from '$lib/components/icons/External.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import { formatDate, formatPrice } from '$lib/format';
	import type { PageData } from './$types';

	export let data: PageData;

	let transactions: any[] | null = null;

	$: subscriptionCreated = $page.url.searchParams.get('subscription_created') === '1';
	$: activeSubscription = data.subscriptions.find(({ status }) => status !== 'canceled');
	$: plan = data.account.plan;

	function onDownloadInvoice(data: { downloadUrl: string }) {
		const url = new URL(data.downloadUrl);
		const a = document.createElement('a');
		a.setAttribute('download', url.pathname.split('/').pop()!);
		a.setAttribute('href', data.downloadUrl);
		a.click();
	}

	function onLoadInvoices(data: { transactions: any[] }) {
		transactions = data?.transactions || [];
	}
</script>

<div class="flex flex-col gap-8">
	{#if subscriptionCreated}
		<Alert variant="success">
			{$_('text.subscription_created')}
		</Alert>
	{/if}

	<div>
		<div class="text-xl">{$_('title.current_plan')}</div>

		<div class="flex gap-3 items-end">
			<span class="font-bold text-xl">{plan?.name || $_('text.no_plan')}</span>
		</div>

		{#if activeSubscription?.paidUntil}
			<div>
				{$_('label.paid_until')}: {formatDate(activeSubscription.paidUntil)}
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-3">
		<div class="text-xl">{$_('title.subscriptions')}</div>

		<List items={data.subscriptions} let:item={subscription}>
			<div class="flex items-center flex-wrap gap-3">
				<div class="grow flex flex-col gap-1">
					<div class="font-bold">{subscription.plan?.name || '-'}</div>
					<div class="text-sm flex gap-2">
						<span class="badge badge-ghost">{subscription.status}</span>
						<span class="opacity-60">{subscription.id}</span>
					</div>

					{#if subscription.nextBillingAt}
						<div>
							<span>{$_('label.next_billing_at')}: {formatDate(subscription.nextBillingAt)}</span>
						</div>
					{/if}
				</div>
				<div class="flex gap-4">
					<a href={subscription.updateUrl} target="_blank" class="link text-xs">
						{$_('button.manage')}
					</a>
					{#if subscription.nextBillingAt}
						<a href={subscription.cancelUrl} target="_blank" class="link text-xs">
							{$_('button.cancel')}
						</a>
					{/if}
				</div>
			</div>
		</List>
	</div>

	<div class="flex flex-col gap-3">
		<div class="text-xl">{$_('title.invoices')}</div>

		{#if transactions}
			<List items={transactions} let:item={transaction}>
				<div class="flex items-center flex-wrap gap-3">
					<div class="grow flex flex-col gap-1">
						<div class="font-bold">{transaction.invoice_number}</div>
						<div class="flex gap-2 text-sm">
							<span
								>{formatPrice(
									parseFloat(transaction.details.totals.total) / 100,
									transaction.details.totals.currency_code
								)}</span
							>
							<span>{formatDate(transaction.created_at)}</span>
						</div>
					</div>

					<div>
						<Form
							action="?/downloadInvoice"
							data={{
								transactionId: transaction.id
							}}
							successToast={false}
							on:submit={(ev) => onDownloadInvoice(ev.detail?.result.data)}
							let:loading
						>
							<button type="submit" class="btn btn-sm" class:disabled={loading}>
								{$_('button.download')}
							</button>
						</Form>
					</div>
				</div>
			</List>
		{:else}
			<div>
				<Form
					action="?/loadInvoices"
					data={{
						subscriptionId: activeSubscription?.id
					}}
					successToast={false}
					on:submit={(ev) => onLoadInvoices(ev.detail?.result?.data)}
					let:loading
				>
					<button type="submit" class="btn btn-sm" class:disabled={loading}
						>{$_('button.load_invoices')}</button
					>
				</Form>
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-3">
		<div class="text-xl">{$_('title.change_plan')}</div>

		<Plans billingCycle={data.account.billingCycle || 'year'} plans={data.plans} value={plan?.id}>
			<div slot="button" let:plan let:price let:selected>
				<Form
					action={!activeSubscription ? '?/checkout' : '?/change'}
					confirmText={!activeSubscription ? void 0 : $_('text.confirm_change_plan')}
					data={{
						planId: plan.id,
						priceId: price?.priceId,
						subscriptionId: activeSubscription?.id
					}}
					successToast={false}
					let:loading
				>
					{#if selected === plan.id}
						<div class="py-3">
							<CheckIcon class="w-6 h-6 text-primary" />
						</div>
					{:else}
						<button
							type="submit"
							class="btn btn-primary w-full gap-4"
							disabled={loading || !price || selected === plan.id}
						>
							{$_('button.select')}
						</button>
					{/if}
				</Form>
			</div>
		</Plans>

		<div>
			<p class="text-sm">{$_('text.price_info')}</p>
		</div>
	</div>
</div>
