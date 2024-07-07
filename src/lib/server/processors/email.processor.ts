import { compileTemplate } from '$lib/markdown';
import { Pdf } from '$lib/pdf';
import { BaseProcessor } from '$lib/server/processors/base.processor';
import { emailService } from '$lib/server/services/email.service';
import { rateLimitByKey } from '$lib/server/ratelimiter';
import type { ProcessorContext } from '$lib/server/services/forms.service';
import type { TResponseData } from '$lib/types';
import { resolveProp } from '$lib/helpers';

export class EmailProcessor extends BaseProcessor<{
	attachPdf: boolean;
	body: string;
	subject: string;
	recipient: string;
}> {
	async run(ctx: ProcessorContext, data: TResponseData): Promise<void> {
		if (ctx.form.account.plan?.featureProcessors !== true) {
			throw new Error(`Not allowed for your billing plan.`);
		}
		try {
			await rateLimitByKey('L3', 'email:' + ctx.form.accountId);
		} catch (err) {
			throw new Error(`Too many requests.`);
		}
		const options = this.getOptions(ctx, data);
		const attachments = [];
		if (options.attachPdf) {
			const pdf = new Pdf({
				pageNumbers: true
			});
			pdf.form(ctx.form, data, {
				files: [],
				responseId: ctx.responseId || void 0
			});
			pdf.footer(`${new Date().toISOString()}\n${ctx.responseId || ''}`);
			attachments.push({
				content: Buffer.from(pdf.buffer()),
				contentType: 'application/pdf',
				filename: `${ctx.responseId || 'response'}.pdf`
			});
		}
		const recipients = options.recipient
			.split(/\,\s{0,}/)
			.map((recipient) => {
				recipient = recipient.trim();
				if (recipient.startsWith('$.')) {
					const value = resolveProp(
						{
							data
						},
						recipient.slice(2)
					);
					if (!value.startsWith('$.')) {
						return value;
					}
					return '';
				}
				return recipient;
			})
			.filter((recipient) => !!recipient)
			.slice(0, 5);
		if (!recipients.length) {
			throw new Error('No recipients.');
		}
		await emailService.sendTemplate(
			compileTemplate(options.body || ''),
			{
				data
			},
			{
				subject: options.subject,
				attachments,
				to: recipients
			}
		);
		ctx.log(`(email) Email sent to ${recipients.length} recipients`);
	}
}
