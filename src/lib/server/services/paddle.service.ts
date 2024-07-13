import { env } from '$lib/server/env';

export class PaddleService {
	readonly baseUrl =
		env.PADDLE_ENV === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';

	async cancelSubscription(subscriptionId: string) {
		return this.request('POST', `/subscriptions/${subscriptionId}/cancel`);
	}

	async createTransaction(accountId: string, priceId: string) {
		return this.request('POST', '/transactions', {
			custom_data: {
				account_id: accountId
			},
			items: [
				{
					price_id: priceId,
					quantity: 1
				}
			]
		});
	}

	async changeSubscriptionPlan(subscriptionId: string, priceId: string) {
		return this.request('PATCH', `/subscriptions/${subscriptionId}`, {
			items: [
				{
					price_id: priceId,
					quantity: 1
				}
			],
			proration_billing_mode: 'prorated_immediately'
		});
	}

	async getTransactions(subscriptionId: string) {
		return this.request('GET', `/transactions?subscription_id=${subscriptionId}`);
	}

	async getTransactionsInvoice(transactionId: string) {
		return this.request('GET', `/transactions/${transactionId}/invoice`);
	}

	async getSubscription(subscriptionId: string) {
		return this.request('GET', `/subscriptions/${subscriptionId}`);
	}

	async request(method: string, uri: string, data?: unknown) {
		const headers: Record<string, string> = {
			authorization: 'Bearer ' + env.PADDLE_API_KEY
		};
		if (method !== 'GET' && data) {
			headers['content-type'] = 'application/json';
		}
		const resp = await fetch(new URL(uri, this.baseUrl), {
			body: data ? JSON.stringify(data) : void 0,
			headers,
			method
		});
		if (resp.status > 204) {
			console.log(await resp.text());
			throw new Error(`Paddle API responded with ${resp.status}.`);
		}
		return resp.json();
	}
}

export const paddleService = new PaddleService();
