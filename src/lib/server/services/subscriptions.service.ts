import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { subscriptions } from '$lib/server/db/schema';

export type ISubscription = NonNullable<
	Awaited<ReturnType<SubscriptionsService['findSubscription']>>
>;

export type ISubscriptionSchema = typeof subscriptions.$inferSelect;

export class SubscriptionsService {
	readonly columns = {
		accountId: true,
		auto: true,
		cancelUrl: true,
		createdAt: true,
		eventPayload: true,
		expiresAt: true,
		id: true,
		lastEventAt: true,
		nextBillingAt: true,
		paidUntil: true,
		planId: true,
		status: true,
		updatedAt: true,
		updateUrl: true
	} as const satisfies Partial<Record<keyof ISubscriptionSchema, boolean>>;

	async findSubscription(subscriptionId: string) {
		return db.query.subscriptions.findFirst({
			columns: this.columns,
			where: eq(subscriptions.id, subscriptionId)
		});
	}

	async listSubscriptionsForAccount(accountId: string) {
		return db.query.subscriptions.findMany({
			columns: this.columns,
			where: eq(subscriptions.accountId, accountId),
			with: {
				plan: {
					columns: {
						name: true
					}
				}
			}
		});
	}

	async createSubscription(
		data: Pick<
			ISubscriptionSchema,
			| 'accountId'
			| 'auto'
			| 'cancelUrl'
			| 'eventPayload'
			| 'id'
			| 'lastEventAt'
			| 'nextBillingAt'
			| 'paidUntil'
			| 'status'
			| 'updateUrl'
		>
	) {
		return db.insert(subscriptions).values(data).returning();
	}

	async udateSubscription(
		subscriptionId: string,
		data: Partial<
			Pick<
				ISubscriptionSchema,
				| 'auto'
				| 'eventPayload'
				| 'expiresAt'
				| 'nextBillingAt'
				| 'paidUntil'
				| 'status'
				| 'lastEventAt'
			>
		>
	) {
		await db
			.update(subscriptions)
			.set({
				auto: data.auto,
				eventPayload: data.eventPayload,
				expiresAt: data.expiresAt,
				lastEventAt: data.lastEventAt,
				nextBillingAt: data.nextBillingAt,
				paidUntil: data.paidUntil,
				status: data.status,
				updatedAt: new Date()
			})
			.where(eq(subscriptions.id, subscriptionId));
	}
}

export const subscriptionsService = new SubscriptionsService();
