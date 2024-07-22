import { getAppBaseUrl, env } from '$lib/server/env';
import { auditlogService } from '$lib/server/services/auditlog.service';
import { emailService } from '$lib/server/services/email.service';
import { accountsService, type IAccount } from '$lib/server/services/accounts.service';
import type { IUser } from '$lib/server/services/users.service';
import type { IInvite } from './invites.service';
import type { IDevice } from './devices.service';
import type { IResponse } from './responses.service';
import type { IForm } from './forms.service';

export enum EEvents {
	ACCOUNTS_SUSPEND = 'accounts.suspend',
	ACCOUNTS_UPDATE = 'accounts.update',
	DEVICES_CREATE = 'devices.create',
	EMERGENCY_ACCESS = 'emergency.access',
	FORMS_DELETE = 'forms.delete',
	FORMS_UPDATE = 'forms.update',
	IDENTITIES_DELETE = 'identities.delete',
	RESPONSES_ACCESS = 'responses.access',
	RESPONSES_DELETE = 'responses.delete',
	RESPONSES_UNDELETE = 'responses.undelete',
	RESPONSES_UPDATE = 'responses.update',
	USERS_INVITE = 'users.invite',
	USERS_REQUEST_RECOVERY = 'users.request_recovery',
	USERS_REQUEST_EMAIL_VERIFICATION = 'users.request_email_verification'
}

export interface IEventContext<Data = unknown> {
	account?: Pick<IAccount, 'auditlog' | 'auditlogRetention' | 'id' | 'name' | 'plan'>;
	data?: Data;
	description?: string;
	event: EEvents;
	form?: Pick<IForm, 'id'> | string;
	ipAddress?: string;
	response?: Pick<IResponse, 'id'> | string;
	user?: Pick<IUser, 'email' | 'id' | 'locale' | 'name'>;
}

export class EventsService {
	async trackEvent(ctx: IEventContext) {
		switch (ctx.event) {
			case EEvents.ACCOUNTS_SUSPEND:
				await this.onAccountSuspended(ctx as Parameters<typeof this.onAccountSuspended>[0]);
				break;
			case EEvents.DEVICES_CREATE:
				await this.onDevicesCreated(ctx as Parameters<typeof this.onDevicesCreated>[0]);
				break;
			case EEvents.EMERGENCY_ACCESS:
				await this.onEmergencyAccess(ctx as Parameters<typeof this.onEmergencyAccess>[0]);
				break;
			case EEvents.USERS_INVITE:
				await this.onUsersInvite(ctx as Parameters<typeof this.onUsersInvite>[0]);
				break;
			case EEvents.USERS_REQUEST_EMAIL_VERIFICATION:
				await this.onUsersRequestEmailVerification(
					ctx as Parameters<typeof this.onUsersRequestEmailVerification>[0]
				);
				break;
			case EEvents.USERS_REQUEST_RECOVERY:
				await this.onUsersRequestRecovery(ctx as Parameters<typeof this.onUsersRequestRecovery>[0]);
				break;
			default:
			// noop
		}
		await auditlogService.trackEvent(ctx);
	}

	private async onAccountSuspended(
		ctx: IEventContext<{
			suspended: IAccount['suspended'];
		}>
	) {
		const { account, data } = ctx;
		if (account) {
			const users = await accountsService.listAccountUsers(account.id);
			const admins = users.filter(({ role }) => role === 'admin');
			for (const admin of admins) {
				const { user } = admin;
				if (user.email) {
					await emailService.sendTemplate(
						emailService.getTemplate(data?.suspended === 'trial_expired' ? 'trial-expired' : 'account-suspended', user.locale),
						{
							accountName: account.name,
							reason: data?.suspended || 'n/a',
						},
						{
							accountId: ctx.account?.id,
							to: user.email
						}
					);
				}
			}
		}
	}

	private async onDevicesCreated(
		ctx: IEventContext<{
			device: IDevice;
		}>
	) {
		const { data, user } = ctx;
		if (data && user?.email) {
			await emailService.sendTemplate(
				emailService.getTemplate('new-device', user.locale),
				{
					deviceIpAddress: data.device.ipAddress,
					deviceName: data.device?.name,
					deviceTimezone: data.device.timezone,
					date: new Date().toISOString().replace('T', ' '),
					userName: user.name
				},
				{
					accountId: ctx.account?.id,
					to: user.email
				}
			);
		}
	}

	private async onEmergencyAccess(
		ctx: IEventContext<{
			device: IDevice;
			user: IUser;
		}>
	) {
		const { data, user } = ctx;
		if (user && data?.device && env.EMERGENCY_ACCESS_NOTIFY) {
			await emailService.sendTemplate(
				emailService.getTemplate('emergency-access', user.locale),
				{
					deviceIpAddress: data.device.ipAddress,
					deviceName: data.device.name,
					deviceTimezone: data.device.timezone,
					date: new Date().toISOString().replace('T', ' '),
					userEmail: user.email
				},
				{
					accountId: ctx.account?.id,
					to: env.EMERGENCY_ACCESS_NOTIFY
				}
			);
		}
	}

	private async onUsersInvite(
		ctx: IEventContext<{
			account: Pick<IAccount, 'id' | 'name'>;
			invite: IInvite;
		}>
	) {
		const { data } = ctx;
		if (data && data.account && ctx.user) {
			await emailService.sendTemplate(
				emailService.getTemplate('invite', ctx.user.locale || 'en-GB'),
				{
					account: {
						name: data.account.name
					},
					email: data.invite.email,
					inviter: {
						email: ctx.user.email || '',
						name: ctx.user.name || ''
					},
					link: `${getAppBaseUrl()}/app/register?invite=${data.invite.id}`
				},
				{
					to: data.invite.email
				}
			);
		}
	}

	private async onUsersRequestEmailVerification(
		ctx: IEventContext<{
			emailVerificationToken: string;
		}>
	) {
		const { data, user } = ctx;
		if (data && user?.email) {
			await emailService.sendTemplate(
				emailService.getTemplate('verify-email', user.locale),
				{
					user: {
						email: user.email,
						name: user.name
					},
					link: `${getAppBaseUrl()}/app/verify_email/${user.id}/${data.emailVerificationToken}`
				},
				{
					to: user.email
				}
			);
		}
	}

	private async onUsersRequestRecovery(
		ctx: IEventContext<{
			recoveryToken: string;
		}>
	) {
		const { data, user } = ctx;
		if (data && user?.email) {
			await emailService.sendTemplate(
				emailService.getTemplate('recover-access', user.locale),
				{
					user: {
						email: user.email,
						name: user.name
					},
					link: `${getAppBaseUrl()}/app/recover_access/${user.id}#?token=${data.recoveryToken}`
				},
				{
					to: user.email
				}
			);
		}
	}
}

export const eventsService = new EventsService();
