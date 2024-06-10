import { and, asc, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { encryptionKeys } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';

export type IEncryptionKey = NonNullable<
	Awaited<ReturnType<EncryptionKeysService['findEncryptionKey']>>
>;

export type IEncryptionKeySchema = typeof encryptionKeys.$inferSelect;

export class EncryptionKeysService {
	readonly columns = {
		createdAt: true,
		deleted: true,
		deletedAt: true,
		hash: true,
		id: true,
		publicKey: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IEncryptionKeySchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.ENC_KEY);
	}

	async countActiveEncryptionKeysForAccount(accountId: string) {
		const [result] = await db
			.select({
				count: count()
			})
			.from(encryptionKeys)
			.where(and(eq(encryptionKeys.accountId, accountId), eq(encryptionKeys.deleted, false)));
		return result.count;
	}

	async createEncryptionKey(data: Pick<IEncryptionKeySchema, 'accountId' | 'hash' | 'publicKey'>) {
		const [result] = await db
			.insert(encryptionKeys)
			.values({
				accountId: data.accountId,
				hash: data.hash,
				id: this.generateId(),
				publicKey: data.publicKey
			})
			.returning();
		return result;
	}

	async deleteEncryptionKey(encryptionKeyId: string) {
		await db
			.update(encryptionKeys)
			.set({
				deleted: true,
				deletedAt: new Date()
			})
			.where(eq(encryptionKeys.id, encryptionKeyId));
	}

	async findEncryptionKey(encryptionKeyId: string) {
		return db.query.encryptionKeys.findFirst({
			columns: this.columns,
			where: eq(encryptionKeys.id, encryptionKeyId)
		});
	}

	async findEncryptionKeyForAccount(accountId: string, encryptionKeyHash?: string | null) {
		if (encryptionKeyHash) {
			const key = await db.query.encryptionKeys.findFirst({
				where: and(
					eq(encryptionKeys.accountId, accountId),
					eq(encryptionKeys.hash, encryptionKeyHash)
				)
			});
			if (key?.deleted) {
				return void 0;
			}
			return key;
		}
		return db.query.encryptionKeys.findFirst({
			orderBy: [desc(encryptionKeys.id)],
			where: and(eq(encryptionKeys.accountId, accountId), eq(encryptionKeys.deleted, false))
		}) as Promise<IEncryptionKey | undefined>;
	}

	async listEncryptionKeysForAccount(accountId: string, onlyValid: boolean = false) {
		return db.query.encryptionKeys.findMany({
			orderBy: [asc(encryptionKeys.deleted), desc(encryptionKeys.id)],
			where: onlyValid
				? and(eq(encryptionKeys.accountId, accountId), eq(encryptionKeys.deleted, false))
				: eq(encryptionKeys.accountId, accountId)
		});
	}
}

export const encryptionKeysService = new EncryptionKeysService();
