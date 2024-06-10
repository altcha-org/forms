import { Type as t } from '@sinclair/typebox';
import { env } from '$lib/server/env';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { accountsService } from '$lib/server/services/accounts.service';
import { invitesService } from '$lib/server/services/invites.service';
import { EUserRole } from '$lib/types.js';
import { ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';
import { usersService } from '$lib/server/services/users.service';

export const load = loadHandler(
	async (event) => {
		const { account } = event.locals;
		const limitUsers = account?.plan?.limitUsers || 0;
		const invites = await invitesService.listInvites(event.params.accountId);
		const users = await accountsService.listAccountUsers(event.params.accountId);
		const usedSeats = invites.length + users.length;
		return {
			canAddUsers: usedSeats < limitUsers,
			emergencyAccessEnabled: env.EMERGENCY_ACCESS_DISABLED !== '1',
			invites,
			users
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;

export const actions = {
	deleteInvite: actionHandler(
		async (event, data) => {
			await invitesService.deleteInvite(event.params.accountId, data.email);
		},
		{
			body: t.Object({
				email: t.String({
					format: 'email'
				})
			}),
			requiredRole: 'admin'
		}
	),

	deleteUser: actionHandler(
		async (event, data) => {
			const user = await usersService.findUser(data.userId);
			if (!user?.accountsToUsers.some(({ account }) => account.id === event.params.accountId)) {
				throw new ForbiddenError();
			}
			if (user?.emergency) {
				await usersService.deleteUser(data.userId);
			} else {
				await accountsService.deleteAccountUser(event.params.accountId, data.userId);
			}
		},
		{
			body: t.Object({
				userId: t.String()
			}),
			requiredRole: 'admin'
		}
	),

	inviteUser: actionHandler(
		async (event, data) => {
			const limit = event.locals.account?.plan?.limitUsers || 0;
			const used = await accountsService.countAccountUsersAndInvites(event.params.accountId);
			if (limit && used >= limit) {
				throw new ForbiddenError();
			}
			if (data.emergency && data.emergencyPassword) {
				await usersService.createUser(
					{
						email: data.email,
						emergency: true,
						emergencyPassword: data.emergencyPassword,
						locale: event.locals.locale
					},
					event.params.accountId,
					'admin'
				);
			} else {
				await invitesService.createInvite({
					accountId: event.params.accountId,
					email: data.email,
					invitedBy: event.locals.user!.id,
					role: data.role
				});
			}
			return {
				success: true
			};
		},
		{
			body: t.Object({
				email: t.String({
					format: 'email'
				}),
				emergency: t.Optional(t.Boolean()),
				emergencyPassword: t.Optional(
					t.String({
						minLength: 8
					})
				),
				role: t.Enum(EUserRole)
			}),
			requiredRole: 'admin'
		}
	),

	updateInvite: actionHandler(
		async (event, data) => {
			await invitesService.updateInvite({
				accountId: event.params.accountId!,
				role: data.role,
				email: data.email
			});
			return {
				success: true
			};
		},
		{
			body: t.Object({
				email: t.String({
					format: 'email'
				}),
				role: t.Enum(EUserRole)
			}),
			requiredRole: 'admin'
		}
	),

	updateUser: actionHandler(
		async (event, data) => {
			await accountsService.updateAccountUser({
				accountId: event.params.accountId!,
				role: data.role,
				userId: data.userId
			});
			return {
				success: true
			};
		},
		{
			body: t.Object({
				role: t.Enum(EUserRole),
				userId: t.String()
			}),
			requiredRole: 'admin'
		}
	)
} satisfies Actions;
