import { and, count, eq, inArray, lte, sql } from 'drizzle-orm';
import { cipher, rsa } from '@altcha/crypto';
import { base64Encode } from '@altcha/crypto/encoding';
import { db } from '$lib/server/db';
import { accounts, accountsToUsers, invites, users } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';
import { encryptionKeysService } from '$lib/server/services/encryptionKeys.service';
import { subscriptionsService } from '$lib/server/services/subscriptions.service';
import { paddleService } from '$lib/server/services/paddle.service';
import { plansService, type IPlan } from '$lib/server/services/plans.service';
import { roundTime } from '../helpers';
import { EEvents, eventsService } from './events.service';

export type IAccount = NonNullable<Awaited<ReturnType<AccountsService['findAccount']>>>;

export type IAccountWithCredentials = NonNullable<
	Awaited<ReturnType<AccountsService['findAccountWithCredentials']>>
>;

export type IAccountSchema = typeof accounts.$inferSelect;

export type IAccountToUser = NonNullable<
	Awaited<ReturnType<AccountsService['listAccountUsers']>>[number]
>;

export class AccountsService {
	readonly columns = {
		auditlog: true,
		auditlogRetention: true,
		billingCycle: true,
		canSendEmails: true,
		createdAt: true,
		encryptionEnabled: true,
		id: true,
		name: true,
		planId: true,
		responses: true,
		timeZone: true,
		trialExpiresAt: true,
		suspended: true,
		updatedAt: true,
		uploads: true
	} as const satisfies Partial<Record<keyof IAccountSchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.ACCOUNT);
	}

	async countAccountUsersAndInvites(accountId: string) {
		const invitesCount = await db
			.select({
				value: count()
			})
			.from(invites)
			.where(eq(invites.accountId, accountId));
		const usersCount = await db
			.select({
				value: count()
			})
			.from(accountsToUsers)
			.where(eq(accountsToUsers.accountId, accountId));
		return invitesCount[0].value + usersCount[0].value;
	}

	async createAccount(
		data: Pick<IAccount, 'name'> &
			Partial<
				Pick<IAccount, 'planId' | 'timeZone'> & {
					plan?: Pick<IPlan, 'id' | 'premium' | 'trialDays'>;
				}
			>
	) {
		const [result] = await db
			.insert(accounts)
			.values({
				canSendEmails: data.plan ? (data.plan.premium ? true : false) : void 0,
				id: this.generateId(),
				name: data.name,
				planId: data.plan?.id || data.planId,
				timeZone: data.timeZone,
				trialExpiresAt: data.plan?.trialDays
					? roundTime(Date.now() + data.plan.trialDays * 86400000)
					: void 0
			})
			.returning();
		return result;
	}

	async createAccountUser(data: Pick<IAccountToUser, 'accountId' | 'userId' | 'role'>) {
		await db.insert(accountsToUsers).values({
			accountId: data.accountId,
			userId: data.userId,
			role: data.role
		});
	}

	async deleteAccount(accountId: string) {
		const subscriptions = await subscriptionsService.listSubscriptionsForAccount(accountId);
		const activeSubscriptions = subscriptions.filter(({ status }) => status !== 'canceled');
		if (activeSubscriptions.length) {
			for (const subscription of activeSubscriptions) {
				await paddleService.cancelSubscription(subscription.id);
			}
		}
		await db.delete(accounts).where(eq(accounts.id, accountId));
	}

	async deleteAccountUser(accountId: string, userId: string) {
		await db
			.delete(accountsToUsers)
			.where(and(eq(accountsToUsers.accountId, accountId), eq(accountsToUsers.userId, userId)));
	}

	async encryptData(accountId: string, data: unknown, encryptionKeyHash?: string | null) {
		const encyptionKey = await encryptionKeysService.findEncryptionKeyForAccount(
			accountId,
			encryptionKeyHash
		);
		if (encyptionKey) {
			const pubKey = await rsa.importPublicKeyPem(encyptionKey.publicKey);
			const dataEncrypted = base64Encode(
				await cipher.encrypt(pubKey, new TextEncoder().encode(JSON.stringify(data)))
			);
			const encryptionKeyHash = encyptionKey.hash;
			return {
				data: null,
				dataEncrypted,
				encrypted: true,
				encryptionKeyHash
			};
		}
		return null;
	}

	async findAccount(accountId: string) {
		return db.query.accounts.findFirst({
			columns: this.columns,
			where: eq(users.id, accountId),
			with: {
				plan: {
					columns: plansService.columns
				}
			}
		});
	}

	async findAccountWithCredentials(accountId: string) {
		return db.query.accounts.findFirst({
			columns: {
				...this.columns,
				smtpSender: true,
				smtpUrl: true
			},
			where: eq(users.id, accountId),
			with: {
				plan: {
					columns: plansService.columns
				}
			}
		});
	}

	async incrementResponses(accountId: string) {
		await db
			.update(accounts)
			.set({
				responses: sql`${accounts.responses} + 1`
			})
			.where(eq(accounts.id, accountId));
	}

	async incrementUploads(accountId: string) {
		await db
			.update(accounts)
			.set({
				uploads: sql`${accounts.uploads} + 1`
			})
			.where(eq(accounts.id, accountId));
	}

	async listAccountUsers(accountId: string) {
		return db.query.accountsToUsers.findMany({
			where: eq(accountsToUsers.accountId, accountId),
			with: {
				user: {
					columns: {
						id: true,
						email: true,
						emergency: true,
						locale: true,
						name: true
					}
				}
			}
		});
	}

	async suspendAccount(accountId: string, suspended: IAccount['suspended']) {
		await db
			.update(accounts)
			.set({
				suspended,
				trialExpiresAt: null
			})
			.where(eq(accounts.id, accountId));
	}

	async suspendExpiredTrials(limit: number = 100) {
		const expired = await db.query.accounts.findMany({
			columns: {
				id: true
			},
			limit,
			where: lte(accounts.trialExpiresAt, new Date())
		});
		await db
			.update(accounts)
			.set({
				suspended: 'trial_expired',
				trialExpiresAt: null
			})
			.where(
				inArray(
					accounts.id,
					expired.map(({ id }) => id)
				)
			);
	}

	async trackSuspendEvent(account: IAccount, data: Pick<IAccountSchema, 'suspended'>) {
		await eventsService.trackEvent({
			account,
			data: {
				suspended: data.suspended
			},
			event: EEvents.ACCOUNTS_SUSPEND
		});
	}

	async updateAccount(
		accountId: string,
		data: Partial<
			Pick<
				IAccountSchema,
				| 'auditlog'
				| 'auditlogRetention'
				| 'billingCycle'
				| 'encryptionEnabled'
				| 'name'
				| 'planId'
				| 'smtpSender'
				| 'smtpUrl'
				| 'timeZone'
			> & { plan?: Pick<IPlan, 'id' | 'premium' | 'trialDays'> }
		>
	) {
		await db
			.update(accounts)
			.set({
				auditlog: data.auditlog,
				auditlogRetention: data.auditlogRetention,
				billingCycle: data.billingCycle,
				canSendEmails: data.plan ? (data.plan.premium ? true : false) : void 0,
				encryptionEnabled: data.encryptionEnabled,
				name: data.name,
				planId: data.planId || data.plan?.id,
				smtpSender: data.smtpSender,
				smtpUrl: data.smtpUrl,
				timeZone: data.timeZone,
				trialExpiresAt: data.plan?.trialDays
					? roundTime(Date.now() + data.plan.trialDays * 86400000)
					: data.plan
						? null
						: void 0,
				updatedAt: new Date()
			})
			.where(eq(accounts.id, accountId));
	}

	async updateAccountPlanFormSubscriptions(accountId: string) {
		const subscriptions = await subscriptionsService.listSubscriptionsForAccount(accountId);
		const activeSubscription = subscriptions.find(({ status }) => status === 'active');
		if (activeSubscription) {
			// TODO:
		} else {
			// TODO: switch to free plan
		}
	}

	async updateAccountUser(accountsToUser: Pick<IAccountToUser, 'accountId' | 'userId' | 'role'>) {
		await db
			.update(accountsToUsers)
			.set({
				role: accountsToUser.role,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(accountsToUsers.accountId, accountsToUser.accountId),
					eq(accountsToUsers.userId, accountsToUser.userId)
				)
			);
	}
}

export const accountsService = new AccountsService();
