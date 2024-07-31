import { responsesService } from '$lib/server/services/responses.service';
import { formsService } from '$lib/server/services/forms.service';
import { identitiesService } from '$lib/server/services/identities.service';
import { accountsService } from '$lib/server/services/accounts.service';
import { sessionsService } from '$lib/server/services/sessions.service';
import { BadRequestError, ForbiddenError } from '$lib/server/errors';
import { createHmacKey, verifySolution } from '$lib/server/altcha';
import {
	normalizeFormId,
	replaceVariables,
	shortenFormId,
	timeZoneToCountryCode
} from '$lib/helpers';
import { rateLimitByKey } from '$lib/server/ratelimiter';
import type { IIdentity, TResponseData } from '$lib/types';
import type { RequestEvent } from '@sveltejs/kit';

export async function formHandler(event: RequestEvent<{ formId: string }>) {
	const formId = normalizeFormId(event.params.formId);
	await rateLimitByKey('L3', formId);
	const formData = await readFormData(event);
	const cleanFormData = cleanupFormData(formData);
	const altcha = formData['altcha'];
	const contextParams = new URLSearchParams(String(formData['__context'] || ''));
	const sessionParams = new URLSearchParams(String(formData['__session'] || ''));
	const referrer = formData['__referrer']
		? formData['__referrer']
		: event.request.headers.get('referer');
	let externalId: string | null = String(formData['__externalId'] || '');
	let dataEncrypted: string | null = null;
	let encryptionKeyHash: string | null = null;
	let identity: Pick<IIdentity, 'id'> | null | undefined = null;
	if (!altcha) {
		throw new ForbiddenError();
	}
	const ok = await verifySolution(String(altcha), createHmacKey(formId));
	if (!ok) {
		throw new ForbiddenError();
	}
	const form = await formsService.findForm(formId);
	if (!form) {
		throw new ForbiddenError();
	}
	let result: Awaited<ReturnType<(typeof formsService)['processData']>> | undefined = void 0;
	let error: boolean = false;
	let responseId: string | null = null;
	if (form.account.suspended) {
		throw new ForbiddenError('Account suspended.');
	}
	if (
		form.account.plan?.limitResponses &&
		form.account.plan?.limitResponses <= form.account.responses
	) {
		throw new ForbiddenError('You have reached the submission limit for your current plan.');
	}
	// don't process demo forms
	if (!form.demo) {
		const context = formsService.createProcessorContext(form);
		for (const [name, value] of contextParams) {
			context.set(name, value);
		}
		if (context.get('timezone')) {
			context.set('country', timeZoneToCountryCode(context.get('timezone') || ''));
		}
		if (form.contextInfo) {
			context.set('ip_address', event.locals.remoteAddress);
			context.set('locale', event.locals.locale);
			context.set('user_agent', event.request.headers.get('user-agent'));
			context.set('referrer', referrer);
		}
		try {
			result = await formsService.processData(
				context,
				formsService.validate(context.form, cleanFormData)
			);
			if (form.account.encryptionEnabled) {
				const encrypted = await formsService.encryptFormData(form, result.data);
				if (encrypted) {
					dataEncrypted = encrypted.dataEncrypted;
					encryptionKeyHash = encrypted.encryptionKeyHash;
				}
			}
		} catch (err) {
			error = true;
			result?.context.log(String(err));
		}
		if (context.store) {
			if (!externalId) {
				const email = result?.data[context.emailBlockName || 'email'];
				if (email) {
					externalId = identitiesService.hashEmail(String(email));
				}
			}
			if (externalId?.length) {
				identity = await identitiesService.upsertIdentity({
					accountId: form.account.id,
					externalId
				});
			}
			const response = await responsesService.createResponse(
				{
					accountId: form.account.id,
					context: result
						? (Object.fromEntries(result.context.metadata.entries()) as Record<string, unknown>)
						: {},
					data: context.store && !dataEncrypted ? result?.data || null : null,
					dataEncrypted,
					encrypted: !!dataEncrypted,
					encryptionKeyHash,
					error,
					formId,
					id: context.responseId,
					identityId: identity?.id || null,
					logs: result?.context.logs || [],
					spam: !!result?.context.spam
				},
				{
					retention: context.retention
				}
			);
			responseId = response.id;
			if (result) {
				await responsesService.linkFiles(form, response, result.data);
			}
			await accountsService.incrementResponses(form.account.id);
			if (
				form.account.plan?.limitResponses &&
				form.account.plan?.trialDays &&
				form.account.plan?.limitResponses <= form.account.responses + 1
			) {
				// trial account
				await accountsService.suspendAccount(form.account.id, 'trial_expired');
				await accountsService.trackSuspendEvent(form.account, {
					suspended: 'trial_expired'
				});
			}
		}
		if (form.account.plan?.featureAnalytics === true) {
			let fields: [string, number, number, number][] = [];
			try {
				fields = JSON.parse(sessionParams.get('fields') || '[]');
			} catch (err) {
				// noop
			}
			await sessionsService.createSession({
				abondoned: false,
				country: context.get('country'),
				error: error || sessionParams.get('error') === 'true',
				fields,
				fieldDropOff: null,
				formId: form.id,
				mobile: context.get('mobile') || false,
				responseId,
				startAt: new Date(parseInt(sessionParams.get('start') || '0', 10) || Date.now()),
				submitAt: new Date(parseInt(sessionParams.get('submit') || '0', 10) || Date.now())
			});
		}
		await formsService.incrementReceivedResponses(form.id);
	}
	if (!error && form.successRedirect) {
		return {
			location: replaceVariables(form.successRedirect, {
				data: formData,
				formId: form.id,
				responseId
			}),
			type: 'redirect'
		};
	}
	const params = new URLSearchParams();
	if (referrer) {
		params.set('ref', String(referrer));
	}
	return {
		location: `/form/${shortenFormId(form.id)}/${error ? 'failed' : 'success'}?${params.toString()}`,
		type: 'redirect'
	};
}

function cleanupFormData(rawFormData: Record<string, unknown>, removeProps: string[] = ['altcha']) {
	return Object.entries(rawFormData).reduce((acc, [key, value]) => {
		if (!removeProps.includes(key) && !key.startsWith('__')) {
			acc[key] = value === '' || value === null ? null : String(value);
		}
		return acc;
	}, {} as TResponseData);
}

async function readFormData(event: RequestEvent<{ formId: string }>) {
	const contentType = event.request.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		return event.request.json();
	} else if (
		contentType.includes('multipart/form-data') ||
		contentType.includes('application/x-www-form-urlencoded')
	) {
		return Object.fromEntries(await event.request.formData());
	}
	throw new BadRequestError('Cannot parse form data.');
}
