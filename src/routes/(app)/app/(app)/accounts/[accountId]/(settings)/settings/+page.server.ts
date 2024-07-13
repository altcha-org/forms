import { Type as t } from '@sinclair/typebox';
import isValidDomain from 'is-valid-domain';
import { fail } from '@sveltejs/kit';
import { accountsService, type IAccount } from '$lib/server/services/accounts.service';
import { EEvents, eventsService } from '$lib/server/services/events.service';
import { auditlogService } from '$lib/server/services/auditlog.service';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { ForbiddenError, ValidationError } from '$lib/server/errors';
import { emailService } from '$lib/server/services/email.service';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async ({ params }) => {
		const accountWithCredentials = await accountsService.findAccountWithCredentials(
			params.accountId
		);
		if (!accountWithCredentials) {
			throw new ForbiddenError();
		}
		return {
			accountWithCredentials
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;

export const actions = {
	updateAccount: actionHandler(
		async (event, data) => {
			const accountId = event.params.accountId;
			const account = await accountsService.findAccountWithCredentials(accountId);
			if (!account) {
				throw new ForbiddenError();
			}
			if (data.smtpUrl) {
				validateSmtpUrl(data.smtpUrl);
			}
			let auditlogRetention = data.auditlogRetention ? +data.auditlogRetention : void 0;
			if (auditlogRetention !== void 0 && account.plan) {
				auditlogRetention = Math.min(account.plan.auditlogMaxRetention, auditlogRetention);
			}
			await accountsService.updateAccount(accountId, {
				auditlog: (data.auditlog ? data.auditlog : null) as IAccount['auditlog'],
				auditlogRetention,
				encryptionEnabled: data.encryptionEnabled,
				name: data.name,
				smtpSender: data.smtpSender,
				smtpUrl: data.smtpUrl
			});
			await eventsService.trackEvent({
				account,
				data: {
					changes: auditlogService.getChanges(account, data)
				},
				event: EEvents.ACCOUNTS_UPDATE,
				ipAddress: event.locals.remoteAddress,
				user: event.locals.user
			});
		},
		{
			body: t.Object({
				auditlog: t.Optional(t.String()),
				auditlogRetention: t.Optional(t.String()),
				encryptionEnabled: t.Boolean(),
				name: t.String({
					minLength: 2,
					maxLength: 256
				}),
				smtpSender: t.Optional(t.String()),
				smtpUrl: t.Optional(
					t.String({
						format: 'uri'
					})
				)
			}),
			requiredRole: 'admin'
		}
	),
	testSmtp: actionHandler(
		async (event, data) => {
			if (!event.locals.user.email) {
				return fail(400, {
					error: 'User email not configured.'
				});
			}
			try {
				validateSmtpUrl(data.smtpUrl);
				await emailService.sendTestEmail(data.smtpUrl, data.smtpSender, event.locals.user.email);
			} catch (err) {
				return fail(400, {
					error:
						typeof err === 'object' && err && 'message' in err
							? String(err.message)
							: 'Unknown error'
				});
			}
		},
		{
			body: t.Object({
				smtpSender: t.String(),
				smtpUrl: t.String({
					format: 'uri'
				})
			}),
			requiredRole: 'admin'
		}
	)
} satisfies Actions;

function validateSmtpUrl(smtpUrl: string) {
	const url = new URL(smtpUrl);
	if (!url.hostname || !isValidDomain(url.hostname)) {
		throw new ValidationError('Invalid SMTP url.');
	}
}
