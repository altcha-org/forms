import {
	Paddle,
	EventName,
	type SubscriptionCreatedEvent,
	type SubscriptionUpdatedEvent,
	type EventEntity
} from '@paddle/paddle-node-sdk';
import { env, getAppBaseUrl } from '$lib/server/env';
import { ForbiddenError } from '$lib/server/errors';
import { requestHandler } from '$lib/server/handlers';
import {
	subscriptionsService,
	type ISubscriptionSchema
} from '$lib/server/services/subscriptions.service';
import { accountsService } from '$lib/server/services/accounts.service';
import { plansService } from '$lib/server/services/plans.service';
import { paddleService } from '$lib/server/services/paddle.service';
import { idgen } from '$lib/server/id';
import type { RequestHandler } from './$types';

const paddle = env.PADDLE_API_KEY ? new Paddle(env.PADDLE_API_KEY) : null;

export const POST = requestHandler(
	async (event) => {
		if (!env.WEBHOOKS_SECRET_TOKEN || event.params.secret !== env.WEBHOOKS_SECRET_TOKEN) {
			throw new ForbiddenError();
		}
		if (!paddle || !env.PADDLE_WEBHOOK_SECRET_KEY) {
			throw new ForbiddenError('Paddle not configured.');
		}
		const signature = event.request.headers.get('paddle-signature') || '';
		if (signature) {
			const body = await event.request.text();
			let eventData: EventEntity | null = null;
			try {
				eventData = paddle.webhooks.unmarshal(body, env.PADDLE_WEBHOOK_SECRET_KEY, signature);
			} catch (err) {
				return {
					error: typeof err === 'object' && err && 'message' in err ? err.message : err,
					ok: false
				};
			}
			if (eventData) {
				// @ts-expect-error ts error
				const { account_id } = (eventData.data.customData || {}) as { account_id?: string };
				if (account_id) {
					const { region } = idgen.decode(account_id);
					if (region !== env.REGION) {
						await forwardEvent(region, event.request, body);
						return {
							forwarded: true,
							ok: true
						};
					}
				}
				switch (eventData.eventType) {
					case EventName.SubscriptionCreated:
						if (account_id) {
							await createSubscription(account_id, eventData);
						}
						break;
					case EventName.SubscriptionUpdated:
						await updateSubscription(eventData);
						break;
					default:
						console.log(eventData.eventType);
				}
			}
		}
		return {
			ok: true
		};
	},
	{
		authorization: false
	}
) satisfies RequestHandler;

async function forwardEvent(region: string, req: Request, body: string, timeout: number = 5000) {
	const controller = new AbortController();
	const tm = setTimeout(() => controller.abort(), timeout);
	const resp = await fetch(
		`${getAppBaseUrl(region)}/webhooks/${env.WEBHOOKS_SECRET_TOKEN}/paddle`,
		{
			body,
			headers: {
				'content-type': req.headers.get('content-type') || '',
				'paddle-signature': req.headers.get('paddle-signature') || ''
			},
			method: 'POST',
			signal: controller.signal
		}
	);
	clearTimeout(tm);
	if (resp.status !== 200) {
		throw new Error(`Forwarding Paddle event failed. Server responded ${resp.status}.`);
	}
}

async function createSubscription(accountId: string, event: SubscriptionCreatedEvent) {
	const data = await getSubscriptionDataFromEvent(event);
	const subscription = await paddleService.getSubscription(event.data.id);
	if (subscription?.data?.status === 'active') {
		await subscriptionsService.createSubscription({
			accountId,
			id: event.data.id,
			cancelUrl: subscription?.data.management_urls?.cancel,
			updateUrl: subscription?.data.management_urls?.update_payment_method,
			...data
		});
		if (data.planId) {
			await accountsService.updateAccount(accountId, {
				billingCycle: getBillingCycle(event),
				plan: subscription.plan,
			});
		}
	}
}

async function updateSubscription(event: SubscriptionUpdatedEvent) {
	const subscriptionId = event.data.id;
	const data = await getSubscriptionDataFromEvent(event);
	await subscriptionsService.udateSubscription(subscriptionId, data);
	const subscription = await subscriptionsService.findSubscription(subscriptionId);
	if (subscription) {
		const account = await accountsService.findAccount(subscription.accountId);
		if (account && account.planId !== subscription.planId) {
			await accountsService.updateAccount(account.id, {
				billingCycle: getBillingCycle(event),
				planId: data.planId
			});
		}
	}
}

async function getSubscriptionDataFromEvent(
	data: SubscriptionCreatedEvent | SubscriptionUpdatedEvent
) {
	const price = data.data.items[0]?.price;
	const plans = await plansService.listPlans();
	const plan = plans.find(({ prices }) => prices.some(({ priceId }) => priceId === price?.id));
	return {
		auto: data.data.collectionMode === 'automatic',
		eventPayload: data as unknown as Record<string, unknown>,
		expiresAt:
			data.data.scheduledChange?.action === 'cancel'
				? new Date(data.data.scheduledChange.effectiveAt)
				: null,
		nextBillingAt: data.data.nextBilledAt ? new Date(data.data.nextBilledAt) : null,
		lastEventAt: new Date(),
		paidUntil: data.data.currentBillingPeriod?.endsAt
			? new Date(data.data.currentBillingPeriod?.endsAt)
			: null,
		planId: plan?.id,
		status: data.data.status
	} satisfies Partial<ISubscriptionSchema>;
}

function getBillingCycle(data: SubscriptionCreatedEvent | SubscriptionUpdatedEvent) {
	switch (data.data.billingCycle.interval) {
		case 'month':
			return 'month';
		case 'year':
			return 'year';
		default:
			return void 0;
	}
}
