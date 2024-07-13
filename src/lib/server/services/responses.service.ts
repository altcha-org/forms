import {} from '@altcha/crypto';
import { and, asc, count, desc, eq, or, inArray, sql, lt, type SQL, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { roundTime } from '$lib/server/helpers';
import {
	accountsToUsers,
	files,
	forms,
	formsToUsers,
	notes,
	responses
} from '$lib/server/db/schema';
import { filesService } from '$lib/server/services/files.service';
import { accountsService } from '$lib/server/services/accounts.service';
import { plansService } from '$lib/server/services/plans.service';
import { auditlogService } from '$lib/server/services/auditlog.service';
import { EEvents, eventsService } from '$lib/server/services/events.service';
import { EIdPrefix, idgen } from '$lib/server/id';
import type { IForm } from '$lib/server/services/forms.service';
import type {
	IFormBlock,
	IOrderByOptions,
	IPaginationOptions,
	IReponseLogEntry,
	TResponseData
} from '$lib/types';
import type { RequestEvent } from '@sveltejs/kit';

export type IResponse = NonNullable<Awaited<ReturnType<ResponsesService['findResponse']>>>;

export type IResponseListItem = NonNullable<
	Awaited<ReturnType<ResponsesService['listResponses']>>
>[number];

export type IResponseSchema = typeof responses.$inferSelect;

export interface IResponsesListOptions {
	formId: string;
	filter?: 'spam' | 'unread' | 'starred';
	limit: number;
	offset: number;
}

export interface IResponsesListExpiredOptions {
	limit: number;
}

export interface IResponsesListForAccountOptions {
	accountId: string;
	limit: number;
	offset: number;
}

export interface IResponsesListForIdentityOptions {
	identityId: string;
	limit: number;
	offset: number;
}

export interface IResponsesCreateResponseOptions {
	retention?: number;
}

export class ResponsesService {
	readonly SPAM_EXPIRE_DAYS = 14;

	readonly columns = {
		accountId: true,
		context: true,
		createdAt: true,
		data: true,
		dataEncrypted: true,
		deleted: true,
		deletedAt: true,
		encrypted: true,
		encryptionKeyHash: true,
		error: true,
		expiresAt: true,
		flag: true,
		formId: true,
		id: true,
		identityId: true,
		labels: true,
		logs: true,
		read: true,
		spam: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IResponseSchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.RESPONSE);
	}

	getExpiresAt(ttlDays: number | undefined) {
		return ttlDays ? roundTime(Date.now() + 86400000 * ttlDays) : null;
	}

	getOrderBy(options: IOrderByOptions) {
		const fn = options.orderDir === 'asc' ? asc : desc;
		switch (options.orderBy) {
			case 'id':
			default:
				return fn(responses.id);
		}
	}

	async countResponsesForAccount(accountId: string) {
		const result = await db
			.select({
				value: count()
			})
			.from(responses)
			.where(eq(responses.accountId, accountId));
		return result[0].value;
	}

	async countResponsesForForm(options: { dateEnd?: Date; dateStart?: Date; formId: string }) {
		const result = await db
			.select({
				value: count(responses.id)
			})
			.from(responses)
			.where(
				and(
					eq(responses.deleted, false),
					eq(responses.spam, false),
					eq(responses.formId, options.formId),
					options.dateStart
						? gte(
								responses.id,
								idgen.prefixed(
									EIdPrefix.RESPONSE,
									idgen.boundary(options.dateStart.getTime(), false)
								)
							)
						: void 0,
					options.dateEnd
						? lte(
								responses.id,
								idgen.prefixed(EIdPrefix.RESPONSE, idgen.boundary(options.dateEnd.getTime(), true))
							)
						: void 0
				)
			);
		return result[0].value;
	}

	async countResponsesForAccountUser(options: {
		accountId: string;
		dateEnd?: Date;
		dateStart?: Date;
		userId: string;
	}) {
		const result = await db
			.select({
				value: count(responses.id)
			})
			.from(responses)
			.leftJoin(forms, eq(forms.id, responses.formId))
			.leftJoin(formsToUsers, eq(formsToUsers.formId, responses.formId))
			.leftJoin(accountsToUsers, eq(accountsToUsers.accountId, responses.accountId))
			.where(
				and(
					eq(responses.accountId, options.accountId),
					eq(responses.deleted, false),
					eq(responses.spam, false),
					options.dateStart
						? gte(
								responses.id,
								idgen.prefixed(
									EIdPrefix.RESPONSE,
									idgen.boundary(options.dateStart.getTime(), false)
								)
							)
						: void 0,
					options.dateEnd
						? lte(
								responses.id,
								idgen.prefixed(EIdPrefix.RESPONSE, idgen.boundary(options.dateEnd.getTime(), true))
							)
						: void 0,
					or(
						eq(forms.restricted, false),
						eq(accountsToUsers.role, 'admin'),
						eq(formsToUsers.userId, options.userId)
					)
				)
			);
		return result[0].value;
	}

	async countResponsesForIdentity(identityId: string) {
		const result = await db
			.select({
				value: count()
			})
			.from(responses)
			.where(eq(responses.identityId, identityId));
		return result[0].value;
	}

	async countResponses(formId: string) {
		const results = await db
			.select({
				flag: responses.flag,
				read: responses.read,
				spam: responses.spam,
				value: count()
			})
			.from(responses)
			.where(and(eq(responses.formId, formId), eq(responses.deleted, false)))
			.groupBy(responses.read, responses.flag, responses.spam);
		const total = results.reduce((acc, { value }) => acc + value, 0);
		const read = results.filter(({ read }) => !!read).reduce((acc, { value }) => acc + value, 0);
		const spam = results.filter(({ spam }) => !!spam).reduce((acc, { value }) => acc + value, 0);
		const starred = results.filter(({ flag }) => !!flag).reduce((acc, { value }) => acc + value, 0);
		const unreadSpam = results
			.filter(({ read, spam }) => !read && !!spam)
			.reduce((acc, { value }) => acc + value, 0);
		return {
			recent: total - spam,
			spam,
			starred,
			total,
			unread: total - read - unreadSpam
		};
	}

	async createResponse(
		data: Pick<
			IResponseSchema,
			| 'accountId'
			| 'formId'
			| 'context'
			| 'data'
			| 'dataEncrypted'
			| 'encrypted'
			| 'encryptionKeyHash'
			| 'error'
			| 'identityId'
			| 'logs'
			| 'spam'
		> &
			Partial<Pick<IResponseSchema, 'id'>>,
		options: IResponsesCreateResponseOptions = {}
	) {
		const [result] = await db
			.insert(responses)
			.values({
				accountId: data.accountId,
				context: data.context,
				formId: data.formId,
				data: data.data,
				dataEncrypted: data.dataEncrypted,
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				error: data.error,
				id: data.id || this.generateId(),
				identityId: data.identityId,
				logs: data.logs,
				spam: data.spam,
				expiresAt: this.getExpiresAt(options.retention)
			})
			.returning();
		return result;
	}

	async deleteExpiredResponses() {
		await db.delete(responses).where(lt(responses.expiresAt, new Date()));
	}

	async deleteResponses(responseIds: string[]) {
		await db
			.update(responses)
			.set({
				deleted: true,
				deletedAt: new Date()
			})
			.where(inArray(responses.id, responseIds));
	}

	async flagResponses(
		responseIds: string[],
		flags: Partial<Pick<IResponse, 'flag' | 'read' | 'spam'>>
	) {
		await db
			.update(responses)
			.set({
				expiresAt:
					flags.spam === true
						? new Date(Date.now() + 86400000 * this.SPAM_EXPIRE_DAYS)
						: flags.spam === false
							? null
							: void 0,
				flag: flags.flag,
				read: flags.read,
				spam: flags.spam
			})
			.where(inArray(responses.id, responseIds));
	}

	async findResponse(responseId: string) {
		return db.query.responses.findFirst({
			columns: this.columns,
			where: (_, { eq }) => eq(responses.id, responseId),
			with: {
				files: {
					columns: {
						id: true
					}
				},
				form: {
					with: {
						account: {
							columns: accountsService.columns,
							with: {
								plan: {
									columns: plansService.columns
								}
							}
						},
						formsToUsers: {
							columns: {
								userId: true
							}
						}
					}
				}
			}
		});
	}

	async findResponseForApi(responseId: string) {
		return db.query.responses.findFirst({
			columns: this.columns,
			where: (_, { eq }) => eq(responses.id, responseId),
			with: {
				files: {
					columns: {
						id: true,
						encrypted: true,
						encryptedSize: true,
						encryptionKeyHash: true,
						name: true,
						public: true,
						size: true,
						type: true
					}
				}
			}
		});
	}

	async listResponses(options: IResponsesListOptions) {
		let where: SQL<unknown> | undefined = void 0;
		switch (options.filter) {
			case 'spam':
				where = and(
					eq(responses.formId, options.formId),
					eq(responses.deleted, false),
					eq(responses.spam, true)
				);
				break;
			case 'starred':
				where = and(
					eq(responses.formId, options.formId),
					eq(responses.deleted, false),
					eq(responses.flag, true)
				);
				break;
			case 'unread':
				where = and(
					eq(responses.formId, options.formId),
					eq(responses.deleted, false),
					eq(responses.read, false),
					eq(responses.spam, false)
				);
				break;
			default:
				where = and(
					eq(responses.formId, options.formId),
					eq(responses.deleted, false),
					eq(responses.spam, false)
				);
		}
		return db
			.select({
				createdAt: responses.createdAt,
				data: responses.data,
				dataEncrypted: responses.dataEncrypted,
				encrypted: responses.encrypted,
				encryptionKeyHash: responses.encryptionKeyHash,
				flag: responses.flag,
				formId: responses.formId,
				id: responses.id,
				labels: responses.labels,
				notes: count(notes.id),
				spam: responses.spam,
				read: responses.read,
				updatedAt: responses.updatedAt
			})
			.from(responses)
			.leftJoin(notes, eq(responses.id, notes.responseId))
			.groupBy(responses.id)
			.orderBy(desc(responses.id))
			.offset(options.offset)
			.limit(options.limit)
			.where(where);
	}

	async listResponsesForAccount(
		options: IPaginationOptions & IOrderByOptions & { accountId: string }
	) {
		return db
			.select({
				createdAt: responses.createdAt,
				data: responses.data,
				dataEncrypted: responses.dataEncrypted,
				encrypted: responses.encrypted,
				encryptionKeyHash: responses.encryptionKeyHash,
				files: count(files.id),
				formId: responses.formId,
				flag: responses.flag,
				id: responses.id,
				labels: responses.labels,
				notes: count(notes.id),
				spam: responses.spam,
				read: responses.read,
				updatedAt: responses.updatedAt
			})
			.from(responses)
			.leftJoin(notes, eq(responses.id, notes.responseId))
			.leftJoin(files, eq(responses.id, files.responseId))
			.groupBy(responses.id)
			.orderBy(this.getOrderBy(options))
			.offset(options.offset)
			.limit(options.limit)
			.where(
				and(
					eq(responses.accountId, options.accountId),
					eq(responses.deleted, false),
					eq(responses.spam, false)
				)
			);
	}

	async listResponsesForAccountAndUser(
		options: IPaginationOptions &
			IOrderByOptions & {
				accountId: string;
				dateStart?: Date;
				dateEnd?: Date;
				formId?: string;
				responseIds?: string[];
				userId: string;
			}
	) {
		return db
			.select({
				createdAt: responses.createdAt,
				data: responses.data,
				dataEncrypted: responses.dataEncrypted,
				encrypted: responses.encrypted,
				encryptionKeyHash: responses.encryptionKeyHash,
				files: count(files.id),
				formId: responses.formId,
				flag: responses.flag,
				id: responses.id,
				labels: responses.labels,
				notes: count(notes.id),
				spam: responses.spam,
				read: responses.read,
				updatedAt: responses.updatedAt
			})
			.from(responses)
			.leftJoin(notes, eq(responses.id, notes.responseId))
			.leftJoin(files, eq(responses.id, files.responseId))
			.leftJoin(forms, eq(forms.id, responses.formId))
			.leftJoin(formsToUsers, eq(formsToUsers.formId, responses.formId))
			.leftJoin(accountsToUsers, eq(accountsToUsers.accountId, responses.accountId))
			.groupBy(responses.id)
			.orderBy(this.getOrderBy(options))
			.offset(options.offset)
			.limit(options.limit)
			.where(
				and(
					eq(responses.accountId, options.accountId),
					eq(responses.deleted, false),
					eq(responses.spam, false),
					options.formId ? eq(responses.formId, options.formId) : void 0,
					options.responseIds ? inArray(responses.id, options.responseIds) : void 0,
					options.dateStart
						? gte(
								responses.id,
								idgen.prefixed(
									EIdPrefix.RESPONSE,
									idgen.boundary(options.dateStart.getTime(), false)
								)
							)
						: void 0,
					options.dateEnd
						? lte(
								responses.id,
								idgen.prefixed(EIdPrefix.RESPONSE, idgen.boundary(options.dateEnd.getTime(), true))
							)
						: void 0,
					or(
						eq(forms.restricted, false),
						eq(accountsToUsers.role, 'admin'),
						eq(formsToUsers.userId, options.userId)
					)
				)
			);
	}

	async listResponsesForIdentity(options: IResponsesListForIdentityOptions) {
		return db
			.select({
				createdAt: responses.createdAt,
				data: responses.data,
				dataEncrypted: responses.dataEncrypted,
				encrypted: responses.encrypted,
				encryptionKeyHash: responses.encryptionKeyHash,
				formId: responses.formId,
				flag: responses.flag,
				id: responses.id,
				labels: responses.labels,
				notes: count(notes.id),
				spam: responses.spam,
				read: responses.read,
				updatedAt: responses.updatedAt
			})
			.from(responses)
			.leftJoin(notes, eq(responses.id, notes.responseId))
			.groupBy(responses.id)
			.orderBy(desc(responses.id))
			.offset(options.offset)
			.limit(options.limit)
			.where(and(eq(responses.identityId, options.identityId), eq(responses.deleted, false)));
	}

	async linkFiles(
		form: IForm,
		response: Pick<IResponse, 'accountId' | 'formId' | 'id'>,
		data: TResponseData
	) {
		const fileBlocks = form.steps.reduce((acc, step) => {
			for (const block of step.blocks) {
				if (['FileInput', 'ImageInput', 'SignatureInput', 'PdfInput'].includes(block.type)) {
					acc.push(block);
				}
			}
			return acc;
		}, [] as IFormBlock[]);
		for (const block of fileBlocks) {
			const blockData = data[block.name];
			if (blockData) {
				const fileIds = String(blockData).split(',');
				if (fileIds.length) {
					const files = await filesService.findFilesBulk(fileIds);
					for (const file of files) {
						if (file.accountId === response.accountId && file.formId === response.formId) {
							await filesService.storage.move(
								filesService.storage.getFilePath(file),
								filesService.storage.getFilePath({ ...file, persistent: true })
							);
							await filesService.updateFile(file.id, {
								expiresAt: null,
								persistent: true,
								responseId: response.id
							});
						}
					}
				}
			}
		}
	}

	async trackAccessEvent(event: RequestEvent, response: IResponse) {
		await eventsService.trackEvent({
			account: response.form.account,
			event: EEvents.RESPONSES_ACCESS,
			form: response.form,
			ipAddress: event.locals.remoteAddress,
			response,
			user: event.locals.user
		});
	}

	async trackDeleteEvent(event: RequestEvent, response: IResponse) {
		await eventsService.trackEvent({
			account: response.form.account,
			event: EEvents.RESPONSES_DELETE,
			form: response.form,
			ipAddress: event.locals.remoteAddress,
			response,
			user: event.locals.user
		});
	}

	async trackUndeleteEvent(event: RequestEvent, response: IResponse) {
		await eventsService.trackEvent({
			account: response.form.account,
			event: EEvents.RESPONSES_UNDELETE,
			form: response.form,
			ipAddress: event.locals.remoteAddress,
			response,
			user: event.locals.user
		});
	}

	async trackUpdateEvent(
		event: RequestEvent,
		response: IResponse,
		oldData: TResponseData,
		newData: TResponseData
	) {
		await eventsService.trackEvent({
			account: response.form.account,
			event: EEvents.RESPONSES_UPDATE,
			data: {
				changes: auditlogService.getChanges(oldData, newData)
			},
			form: response.form,
			ipAddress: event.locals.remoteAddress,
			response,
			user: event.locals.user
		});
	}

	async undeleteResponses(responseIds: string[]) {
		await db
			.update(responses)
			.set({
				deleted: false,
				deletedAt: null
			})
			.where(inArray(responses.id, responseIds))
			.returning();
	}

	async updateResponse(
		responseId: string,
		data: Partial<
			Pick<IResponse, 'data' | 'dataEncrypted' | 'encrypted' | 'encryptionKeyHash' | 'labels'>
		>,
		logs?: IReponseLogEntry[]
	) {
		await db
			.update(responses)
			.set({
				data: data.data,
				dataEncrypted: data.dataEncrypted,
				encrypted: data.encrypted,
				encryptionKeyHash: data.encryptionKeyHash,
				labels: data.labels,
				logs: logs ? sql`logs::jsonb || ${logs}::jsonb` : void 0,
				updatedAt: new Date()
			})
			.where(eq(responses.id, responseId))
			.returning({
				id: responses.id
			});
	}
}

export const responsesService = new ResponsesService();
