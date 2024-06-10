import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { redirect } from '@sveltejs/kit';
import { subscriptionsService } from '$lib/server/services/subscriptions.service';
import { plansService } from '$lib/server/services/plans.service';
import { paddleService } from '$lib/server/services/paddle.service';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const accountId = event.params.accountId;
		const subscriptions = await subscriptionsService.listSubscriptionsForAccount(accountId);
		const plans = await plansService.listPlans();
		return {
			plans,
			subscriptions
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;

export const actions = {
	change: actionHandler(
		async (event, data) => {
			const accountId = event.params.accountId;
			const subscription = await subscriptionsService.findSubscription(data.subscriptionId);
			if (subscription?.accountId === accountId) {
				await paddleService.changeSubscriptionPlan(data.subscriptionId, data.priceId);
			}
		},
		{
			body: t.Object({
				planId: t.String(),
				priceId: t.String(),
				subscriptionId: t.String()
			}),
			requiredRole: 'admin'
		}
	),
	checkout: actionHandler(
		async (event, data) => {
			const accountId = event.params.accountId;
			const resp = await paddleService.createTransaction(accountId, data.priceId);
			if (resp?.data?.id) {
				throw redirect(303, `/paddle/transaction?_ptxn=${resp.data.id}`);
			}
		},
		{
			body: t.Object({
				planId: t.String(),
				priceId: t.String()
			}),
			requiredRole: 'admin'
		}
	),
	downloadInvoice: actionHandler(
		async (event, data) => {
			const resp = await paddleService.getTransactionsInvoice(data.transactionId);
			return {
				downloadUrl: resp.data.url
			};
		},
		{
			body: t.Object({
				transactionId: t.String()
			}),
			requiredRole: 'admin'
		}
	),
	loadInvoices: actionHandler(
		async (event, data) => {
			const accountId = event.params.accountId;
			const subscription = await subscriptionsService.findSubscription(data.subscriptionId);
			if (subscription?.accountId === accountId) {
				const resp = await paddleService.getTransactions(data.subscriptionId);
				return {
					transactions: resp.data.filter(
						({ invoice_id, status }: { invoice_id?: string; status?: string }) =>
							!!invoice_id && status === 'completed'
					)
				};
			}
		},
		{
			body: t.Object({
				subscriptionId: t.String()
			}),
			requiredRole: 'admin'
		}
	)
} satisfies Actions;
