import { eq, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { plans } from '$lib/server/db/schema';

export type IPlan = NonNullable<Awaited<ReturnType<PlansService['findPlanById']>>>;

export class PlansService {
	readonly columns = {
		auditlogMaxRetention: true,
		deprecated: true,
		featureAnalytics: true,
		featureAuditlog: true,
		featureFiles: true,
		featureForms: true,
		featureNotes: true,
		featureProcessors: true,
		group: true,
		id: true,
		limitApi: true,
		limitApiKeys: true,
		limitEncryptionKeys: true,
		limitFileSize: true,
		limitForms: true,
		limitResponses: true,
		limitUploads: true,
		limitUsers: true,
		hidden: true,
		name: true,
		premium: true,
		prices: true,
		trialDays: true
	} as const satisfies Partial<Record<keyof typeof plans.$inferSelect, boolean>>;

	async getDefaultPlan() {
		const plan = await db.query.plans.findFirst({
			where: eq(plans.default, true)
		});
		if (!plan) {
			const [{ value }] = await db
				.select({
					value: count()
				})
				.from(plans);
			if (value === 0) {
				// create a default plan if no user-defined plans were found
				const [createdPlan] = await db
					.insert(plans)
					.values({
						default: true,
						id: 'default',
						limitApi: 1_000_000,
						name: 'Default Plan',
						prices: [],
						premium: true
					})
					.returning();
				return createdPlan;
			}
		}
		return plan;
	}

	async findPlanById(planId: string) {
		return db.query.plans.findFirst({
			columns: this.columns,
			where: eq(plans.id, planId)
		});
	}

	async listPlans() {
		return db.query.plans.findMany({
			columns: this.columns,
			where: eq(plans.hidden, false)
		});
	}
}

export const plansService = new PlansService();
