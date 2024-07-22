import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { eq, lt, inArray } from 'drizzle-orm';
import { env } from '$lib/server/env';
import { db } from '$lib/server/db';
import { roundTime } from '$lib/server/helpers';
import { files } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';
import { FsStorage } from '$lib/server/storage/fs.storage';
import { S3Storage } from '$lib/server/storage/s3.storage';
import { hmac } from '../helpers';
import type { BaseStorage } from '$lib/server/storage/base.storage';

export type IFile = NonNullable<Awaited<ReturnType<FilesService['findFile']>>>;

export type IFileWithoutAccount = Omit<IFile, 'account'>;

export type IFileSchema = typeof files.$inferSelect;

export class FilesService {
	readonly columns = {
		accountId: true,
		createdAt: true,
		encrypted: true,
		encryptedSize: true,
		encryptionKeyHash: true,
		expiresAt: true,
		finalized: true,
		formId: true,
		id: true,
		name: true,
		persistent: true,
		public: true,
		responseId: true,
		size: true,
		type: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IFileSchema, boolean>>;

	readonly tmp = new FsStorage({
		dir: join(tmpdir(), 'altcha')
	});

	readonly storage: BaseStorage;

	constructor() {
		switch (env.STORAGE_PROVIDER) {
			case 's3':
				this.storage = new S3Storage({
					accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID!,
					bucket: env.STORAGE_S3_BUCKET!,
					endpoint: env.STORAGE_S3_ENDPOINT!,
					region: env.STORAGE_S3_REGION!,
					secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY!
				});
				break;
			case 'fs':
			default:
				this.storage = new FsStorage({
					dir: env.STORAGE_FS_DIR!
				});
		}
	}

	generateId() {
		return idgen.prefixed(EIdPrefix.FILE);
	}

	generateUploadToken(file: Pick<IFile, 'id' | 'size' | 'type'>) {
		return hmac([file.id, file.type, file.size].join(';'));
	}

	getExpireTime(ttl: number = 3600000) {
		return roundTime(Date.now() + ttl);
	}

	async getUploadUrl(file: Pick<IFile, 'accountId' | 'id' | 'name' | 'persistent' | 'size' | 'type'>) {
		return this.storage.getUploadUrl(file);
	}

	async createFile(
		data: Pick<
			IFileSchema,
			| 'accountId'
			| 'encrypted'
			| 'encryptionKeyHash'
			| 'formId'
			| 'persistent'
			| 'responseId'
			| 'name'
			| 'public'
			| 'size'
			| 'type'
		>
	) {
		const [result] = await db
			.insert(files)
			.values({
				accountId: data.accountId,
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				expiresAt: this.getExpireTime(),
				finalized: false,
				formId: data.formId,
				id: this.generateId(),
				name: data.name,
				persistent: data.persistent,
				public: data.public,
				responseId: data.responseId,
				size: data.size,
				type: data.type
			})
			.returning();
		return result;
	}

	async deleteExpiredFiles() {
		await db.delete(files).where(lt(files.expiresAt, new Date()));
	}

	async findFile(fileId: string) {
		return db.query.files.findFirst({
			columns: this.columns,
			where: eq(files.id, fileId),
			with: {
				account: {
					with: {
						plan: {
							columns: {
								limitFileSize: true
							}
						}
					}
				}
			}
		});
	}

	async findFilesBulk(fileIds: string[]) {
		return db.query.files.findMany({
			columns: this.columns,
			where: inArray(files.id, fileIds)
		});
	}

	async updateFile(
		fileId: string,
		data: Partial<
			Pick<
				IFile,
				| 'encrypted'
				| 'encryptionKeyHash'
				| 'encryptedSize'
				| 'finalized'
				| 'responseId'
				| 'expiresAt'
				| 'persistent'
			>
		>
	) {
		await db
			.update(files)
			.set({
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				encryptedSize: data.encryptedSize,
				expiresAt: data.expiresAt,
				finalized: data.finalized,
				persistent: data.persistent,
				responseId: data.responseId,
				updatedAt: new Date()
			})
			.where(eq(files.id, fileId));
	}

	async updateFilesBulk(
		fileIds: string[],
		data: Partial<Pick<IFile, 'persistent' | 'responseId' | 'expiresAt'>>
	) {
		await db
			.update(files)
			.set({
				expiresAt: data.expiresAt,
				persistent: data.persistent,
				responseId: data.responseId,
				updatedAt: new Date()
			})
			.where(inArray(files.id, fileIds));
	}

	async verifyUploadToken(file: IFile, uploadToken: string | null | undefined) {
		return !!uploadToken && this.generateUploadToken(file) === uploadToken;
	}
}

export const filesService = new FilesService();
