import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { identities } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';

export type IIdentity = NonNullable<Awaited<ReturnType<IdentitiesService['findIdentity']>>>;

export type IIdentitySchema = typeof identities.$inferSelect;

export interface IIdentitiesListForAccountOptions {
	accountId: string;
	limit: number;
	offset: number;
}

export class IdentitiesService {
	readonly columns = {
		accountId: true,
		createdAt: true,
		id: true,
		encrypted: true,
		encryptionKeyHash: true,
		externalId: true,
		metadata: true,
		metadataEncrypted: true,
		lastUsedAt: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IIdentitySchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.IDENTITY);
	}

	hashEmail(email: string) {
		return createHash('sha256').update(email).digest('hex');
	}

	async createIdentity(
		data: Pick<
			IIdentitySchema,
			| 'accountId'
			| 'encrypted'
			| 'encryptionKeyHash'
			| 'externalId'
			| 'metadata'
			| 'metadataEncrypted'
		>
	) {
		const [result] = await db
			.insert(identities)
			.values({
				accountId: data.accountId,
				id: this.generateId(),
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				externalId: data.externalId,
				metadata: data.metadata,
				metadataEncrypted: data.metadataEncrypted
			})
			.returning();
		return result;
	}

	async deleteIdentity(identityId: string) {
		await db.delete(identities).where(eq(identities.id, identityId));
	}

	async findIdentity(identityId: string) {
		return db.query.identities.findFirst({
			columns: this.columns,
			where: eq(identities.id, identityId)
		});
	}

	async findIdentityByExternalId(externalId: string) {
		return db.query.identities.findFirst({
			columns: this.columns,
			where: eq(identities.externalId, externalId)
		});
	}

	async listIdentitiesForAccount(options: IIdentitiesListForAccountOptions) {
		return db.query.identities.findMany({
			columns: this.columns,
			limit: options.limit,
			offset: options.offset,
			where: eq(identities.accountId, options.accountId)
		});
	}

	async updateIdentity(
		identityId: string,
		data: Partial<
			Pick<
				IIdentitySchema,
				'encrypted' | 'encryptionKeyHash' | 'externalId' | 'metadata' | 'metadataEncrypted'
			>
		>
	) {
		await db
			.update(identities)
			.set({
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				externalId: data.externalId,
				metadata: data.metadata,
				metadataEncrypted: data.metadataEncrypted,
				updatedAt: new Date()
			})
			.where(eq(identities.id, identityId));
	}

	async upsertIdentity(data: Pick<IIdentitySchema, 'accountId' | 'externalId'>) {
		const [result] = await db
			.insert(identities)
			.values({
				accountId: data.accountId,
				id: this.generateId(),
				externalId: data.externalId
			})
			.onConflictDoUpdate({
				target: [identities.accountId, identities.externalId],
				set: {
					lastUsedAt: new Date()
				}
			})
			.returning({
				id: identities.id
			});
		return result;
	}
}

export const identitiesService = new IdentitiesService();
