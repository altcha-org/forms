import { responsesService } from '$lib/server/services/responses.service';
import { formsService } from '$lib/server/services/forms.service';
import { identitiesService } from '$lib/server/services/identities.service';
import { ForbiddenError } from '$lib/server/errors';
import { createHmacKey, verifySolution } from '$lib/server/altcha';
import { normalizeFormId, replaceVariables, shortenFormId } from '$lib/helpers';
import { requestHandler } from '$lib/server/handlers';
import { rateLimitByKey } from '$lib/server/ratelimiter';
import type { RequestHandler } from './$types';
import type { IIdentity, TResponseData } from '$lib/types';

export const POST = requestHandler(
	async (event) => {
		const formId = normalizeFormId(event.params.formId);
		await rateLimitByKey('L3', formId);
		const formData = Object.fromEntries(
			(await event.request.formData()).entries()
		) as TResponseData;
		const altcha = formData.altcha;
		const contextParams = new URLSearchParams(String(formData.__context || ''));
		const referrer =
			formData.__referrer === void 0 ? event.request.headers.get('referer') : formData.__referrer;
		let externalId: string | null = (formData.__externalId as string) || null;
		let dataEncrypted: string | null = null;
		let encryptionKeyHash: string | null = null;
		let identity: Pick<IIdentity, 'id'> | null | undefined = null;
		if (!altcha) {
			throw new ForbiddenError();
		}
		delete formData.altcha;
		delete formData.__context;
		delete formData.__externalId;
		delete formData.__referrer;
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
		// don't process demo forms
		if (!form.demo) {
			const context = formsService.createProcessorContext(form);
			for (const [name, value] of contextParams) {
				context.set(name, value);
			}
			if (form.contextInfo) {
				context.set('ip-address', event.locals.remoteAddress);
				context.set('locale', event.locals.locale);
				context.set('uset-agent', event.request.headers.get('user-agent'));
				context.set('referrer', referrer);
			}
			try {
				result = await formsService.processData(
					context,
					formsService.validate(context.form, formData)
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
			} finally {
				if (context.store) {
					if (!externalId && context.emailBlockName) {
						const email = result?.data[context.emailBlockName];
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
						await responsesService.linkFiles(form, response.id, result.data);
					}
				}
				await formsService.incrementReceivedResponses(form.id);
			}
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
			params.set('ref', btoa(String(referrer)));
		}
		return {
			location: `/form/${shortenFormId(form.id)}/${error ? 'failed' : 'success'}?${params.toString()}`,
			type: 'redirect'
		};
	},
	{
		authorization: false
	}
) satisfies RequestHandler;
