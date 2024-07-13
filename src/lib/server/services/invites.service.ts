import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accountsToUsers, invites } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';
import { EEvents, eventsService } from '$lib/server/services/events.service';
import type { IUser } from './users.service';

export type IInvite = NonNullable<Awaited<ReturnType<InvitesService['findInvite']>>>;

export type IInviteSchema = typeof invites.$inferSelect;

export class InvitesService {
	readonly columns = {
		createdAt: true,
		email: true,
		id: true,
		invitedBy: true,
		role: true,
		status: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IInviteSchema, boolean>>;

	generateId() {
		return idgen.prefixed(EIdPrefix.INVITE);
	}

	async acceptInvite(user: Pick<IUser, 'id' | 'email'>, inviteId: string) {
		const invite = await db.query.invites.findFirst({
			where: eq(invites.id, inviteId)
		});
		if (invite && invite.status === 'pending' && invite.email === user.email) {
			await db.insert(accountsToUsers).values({
				accountId: invite.accountId,
				role: invite.role,
				userId: user.id
			});
			await db.delete(invites).where(eq(invites.id, inviteId));
		}
	}

	async createInvite(data: Pick<IInviteSchema, 'accountId' | 'email' | 'role' | 'invitedBy'>) {
		const id = this.generateId();
		await db.insert(invites).values({
			accountId: data.accountId,
			email: data.email,
			id,
			invitedBy: data.invitedBy,
			role: data.role
		});
		const invite = await this.findInvite(id);
		if (!invite) {
			throw new Error('Failed to create invite.');
		}
		await eventsService.trackEvent({
			data: {
				account: invite.account,
				invite
			},
			event: EEvents.USERS_INVITE,
			user: invite.inviter
		});
		return invite;
	}

	async declineInvite(user: IUser, inviteId: string) {
		await db
			.update(invites)
			.set({
				status: 'declined'
			})
			.where(and(eq(invites.id, inviteId), eq(invites.email, user.email!)));
	}

	async deleteInvite(accountId: string, email: string) {
		await db.delete(invites).where(and(eq(invites.accountId, accountId), eq(invites.email, email)));
	}

	async findInvite(inviteId: string) {
		return db.query.invites.findFirst({
			columns: this.columns,
			where: eq(invites.id, inviteId),
			with: {
				account: {
					columns: {
						id: true,
						name: true
					}
				},
				inviter: {
					columns: {
						email: true,
						id: true,
						locale: true,
						name: true
					}
				}
			}
		});
	}

	async listInvites(accountId: string) {
		return db.query.invites.findMany({
			columns: this.columns,
			orderBy: [asc(invites.createdAt)],
			where: (invites, { eq }) => eq(invites.accountId, accountId)
		});
	}

	async listInvitesForEmail(email: string) {
		return db.query.invites.findMany({
			columns: this.columns,
			orderBy: [asc(invites.createdAt)],
			where: and(eq(invites.email, email), inArray(invites.status, ['pending'])),
			with: {
				account: {
					columns: {
						name: true
					}
				},
				inviter: {
					columns: {
						name: true
					}
				}
			}
		});
	}

	async updateInvite(invite: Pick<IInviteSchema, 'accountId' | 'email' | 'role'>) {
		await db
			.update(invites)
			.set({
				role: invite.role,
				updatedAt: new Date()
			})
			.where(and(eq(invites.accountId, invite.accountId), eq(invites.email, invite.email)));
	}
}

export const invitesService = new InvitesService();
