import { randomBytes } from 'node:crypto';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { apiKeys } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';
import { plansService } from '$lib/server/services/plans.service';
import { accountsService } from '$lib/server/services/accounts.service';

export type IApiKey = NonNullable<Awaited<ReturnType<ApiKeysService['findApiKey']>>>;

export type IApiKeySchema = typeof apiKeys.$inferSelect;

export class ApiKeysService {
	readonly columns = {
		createdAt: true,
		deleted: true,
		deletedAt: true,
		features: true,
		id: true,
		name: true,
		referrer: true,
		secret: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IApiKeySchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.API_KEY);
	}

	generateSecret() {
		return randomBytes(12).toString('hex');
	}

	async countActiveApiKeysForAccount(accountId: string) {
		const [result] = await db
			.select({
				count: count()
			})
			.from(apiKeys)
			.where(and(eq(apiKeys.accountId, accountId), eq(apiKeys.deleted, false)));
		return result.count;
	}

	async createApiKey(
		data: Pick<IApiKeySchema, 'accountId' | 'features' | 'name' | 'referrer' | 'secret'>
	) {
		const [result] = await db
			.insert(apiKeys)
			.values({
				accountId: data.accountId,
				features: data.features,
				id: this.generateId(),
				name: data.name,
				referrer: data.referrer || '',
				secret: data.secret || this.generateSecret()
			})
			.returning();
		return result;
	}

	async deleteApiKey(apiKeyId: string) {
		await db.delete(apiKeys).where(eq(apiKeys.id, apiKeyId));
	}

	async findApiKey(apiKeyId: string) {
		return db.query.apiKeys.findFirst({
			columns: this.columns,
			where: eq(apiKeys.id, apiKeyId),
			with: {
				account: {
					columns: accountsService.columns,
					with: {
						plan: {
							columns: plansService.columns
						}
					}
				}
			}
		});
	}

	async invalidateApiKey(apiKeyId: string) {
		await db
			.update(apiKeys)
			.set({
				deleted: true,
				deletedAt: new Date()
			})
			.where(eq(apiKeys.id, apiKeyId));
	}

	async listApiKeysForAccount(accountId: string) {
		return db.query.apiKeys.findMany({
			columns: this.columns,
			orderBy: [asc(apiKeys.deleted), desc(apiKeys.id)],
			where: eq(apiKeys.accountId, accountId)
		});
	}

	async updateApiKey(
		apiKeyId: string,
		data: Partial<Pick<IApiKey, 'features' | 'name' | 'referrer' | 'secret'>>
	) {
		await db
			.update(apiKeys)
			.set({
				features: data.features,
				name: data.name,
				referrer: data.referrer?.trim(),
				secret: data.secret?.trim(),
				updatedAt: new Date()
			})
			.where(eq(apiKeys.id, apiKeyId));
	}
}

export const apiKeysService = new ApiKeysService();
