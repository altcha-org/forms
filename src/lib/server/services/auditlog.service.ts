import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { auditlog } from '$lib/server/db/schema';
import { accountsService } from '$lib/server/services/accounts.service';
import { roundTime } from '$lib/server/helpers';
import { EIdPrefix, idgen } from '$lib/server/id';
import { EEvents, type IEventContext } from '$lib/server/services/events.service';

export interface IAuditlogListOptions {
	responseId?: string;
	limit?: number;
	offset?: number;
}

export type IAuditlogEvent = NonNullable<Awaited<ReturnType<AuditlogService['findEvent']>>>;

export type IAuditlogEventListItem = NonNullable<
	Awaited<ReturnType<AuditlogService['listEvents']>>
>[number];

export type IAuditlogEventSchema = typeof auditlog.$inferSelect;

export class AuditlogService {
	generateId() {
		return idgen.prefixed(EIdPrefix.LOG);
	}

	getExpiresAt(ttl: number | undefined) {
		return ttl ? roundTime(Date.now() + ttl) : null;
	}

	getChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>) {
		const getChanges = (
			a: Record<string, unknown>,
			b: Record<string, unknown>,
			result: [Array<string | number>, unknown, unknown][] = [],
			path: Array<string | number> = []
		) => {
			const keys = [...new Set([...Object.keys(b), ...(path.length === 0 ? [] : Object.keys(a))])];
			return keys.reduce((acc, key) => {
				const value = b[key];
				const oldValue = a[key];
				if (value && typeof value === 'object') {
					getChanges(
						(oldValue || {}) as Record<string, unknown>,
						value as Record<string, unknown>,
						result,
						[...path, key]
					);
				} else if (String(oldValue) !== String(value)) {
					acc.push([[...path, key], oldValue, value]);
				}
				return acc;
			}, result);
		};
		return getChanges(oldData, newData);
	}

	async countEvents(accountId: string, responseId?: string) {
		const [result] = await db
			.select({
				count: count()
			})
			.from(auditlog)
			.where(
				responseId
					? and(eq(auditlog.accountId, accountId), eq(auditlog.responseId, responseId))
					: eq(auditlog.accountId, accountId)
			);
		return result.count;
	}

	async findEvent(eventId: string) {
		const event = await db.query.auditlog.findFirst({
			where: eq(auditlog.id, eventId),
			with: {
				account: {
					columns: {
						encryptionEnabled: true,
						name: true
					}
				},
				form: {
					columns: {
						name: true
					}
				},
				response: {
					columns: {
						deleted: true
					}
				},
				user: {
					columns: {
						name: true
					}
				}
			}
		});
		return event;
	}

	async listEvents(accountId: string, options: IAuditlogListOptions = {}) {
		return db.query.auditlog.findMany({
			columns: {
				createdAt: true,
				deviceId: true,
				event: true,
				formId: true,
				id: true,
				ipAddress: true,
				responseId: true,
				userId: true,
				version: true
			},
			limit: options.limit,
			offset: options.offset,
			orderBy: [desc(auditlog.id)],
			where: options.responseId
				? and(eq(auditlog.accountId, accountId), eq(auditlog.responseId, options.responseId))
				: eq(auditlog.accountId, accountId),
			with: {
				account: {
					columns: {
						encryptionEnabled: true,
						name: true
					}
				},
				form: {
					columns: {
						name: true
					}
				},
				user: {
					columns: {
						name: true
					}
				}
			}
		});
	}

	async trackEvent(ctx: IEventContext) {
		if (ctx.account?.auditlog && ctx.account.plan?.featureAuditlog !== false) {
			if (ctx.account.auditlog === 'changes' && [EEvents.RESPONSES_ACCESS].includes(ctx.event)) {
				return false;
			}
			const encrypted = ctx.data
				? await accountsService.encryptData(ctx.account.id, ctx.data)
				: null;
			let retentionDays = ctx.account.auditlogRetention ? +ctx.account.auditlogRetention : 90;
			if (ctx.account.plan) {
				retentionDays = Math.min(ctx.account.plan.auditlogMaxRetention, retentionDays);
			}
			const expiresAt = this.getExpiresAt(retentionDays * 86400000);
			await db.insert(auditlog).values({
				id: this.generateId(),
				accountId: ctx.account.id,
				expiresAt,
				data: encrypted ? null : ctx.data,
				dataEncrypted: encrypted?.dataEncrypted,
				description: ctx.description,
				encrypted: !!encrypted,
				encryptionKeyHash: encrypted?.encryptionKeyHash,
				event: ctx.event,
				formId: typeof ctx.form === 'string' ? ctx.form : ctx.form?.id,
				ipAddress: ctx.ipAddress,
				nodeId: env.NODE_ID,
				responseId: typeof ctx.response === 'string' ? ctx.response : ctx.response?.id,
				userId: ctx.user?.id,
				version: env.VERSION
			});
			return true;
		}
		return false;
	}
}

export const auditlogService = new AuditlogService();
