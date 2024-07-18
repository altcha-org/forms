import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import nodemailer from 'nodemailer';
import { glob } from 'glob';
import duration from 'parse-duration';
import { LRUCache } from 'lru-cache';
import { env } from '$lib/server/env';
import { compileTemplate, renderTemplate, type Template } from '$lib/markdown';
import { accountsService } from '$lib/server/services/accounts.service';

export interface EmailServiceSendOptions {
	accountId?: string;
	attachments?: {
		content: string | Buffer | ReadableStream;
		contentType: string;
		filename: string;
	}[];
	from?: string;
	html?: string;
	responseId?: string;
	subject?: string;
	text?: string;
	to: string | string[];
}

export class EmailService {
	readonly DEFAULT_CONNECTION_TIMEOUT = 10000;

	readonly DEFAULT_GREETING_TIMEOUT = 6000;

	readonly defaultTransport = env.SMTP_URL
		? this.createTransport(env.SMTP_URL, env.SMTP_SENDER)
		: null;

	readonly templates = new Map<string, Map<string, Template>>();

	readonly transports = new LRUCache<string, nodemailer.Transporter>({
		max: 500,
		ttl: duration('20min')
	});

	async getTransportForAccount(accountId: string) {
		let transport = this.transports.get(accountId);
		if (transport) {
			return transport;
		}
		const account = await accountsService.findAccountWithCredentials(accountId);
		if (account?.smtpUrl) {
			transport = this.createTransport(account.smtpUrl, account.smtpSender || void 0);
		} else if (this.defaultTransport) {
			transport = this.defaultTransport;
		}
		this.transports.set(accountId, transport);
		return transport;
	}

	createTransport(connectionString: string, from?: string) {
		const url = new URL(connectionString);
		const secure = url.searchParams.get('secure') === 'true';
		const ignoreTLS = url.searchParams.get('ignoreTLS') === 'true';
		const requireTLS = url.searchParams.get('requireTLS') === 'true';
		const rejectUnauthorized = url.searchParams.get('rejectUnauthorized') !== 'false';
		url.search = '';
		return nodemailer.createTransport(url.toString(), {
			connectionTimeout: this.DEFAULT_CONNECTION_TIMEOUT,
			disableFileAccess: true,
			disableUrlAccess: true,
			greetingTimeout: this.DEFAULT_GREETING_TIMEOUT,
			from,
			ignoreTLS,
			requireTLS,
			secure,
			tls: {
				rejectUnauthorized: rejectUnauthorized
			}
		});
	}

	getTemplate(name: string, locale: string) {
		const templates = this.templates.get(name);
		if (!templates) {
			throw new Error(`Email template ${name} not found.`);
		}
		const template = templates.get(locale) || templates.get('en-GB');
		if (!template) {
			throw new Error(`Email template ${name} with locale ${locale} not found.`);
		}
		return template;
	}

	async compileTemplates(globPath: string = 'templates/emails/**/*.md') {
		const files = await glob(globPath);
		for (const file of files) {
			const [name, locale] = path.basename(file, '.md').split('.');
			if (!this.templates.has(name)) {
				this.templates.set(name, new Map());
			}
			this.templates.get(name)!.set(locale, compileTemplate(await fsp.readFile(file, 'utf-8')));
		}
	}

	async send(options: EmailServiceSendOptions) {
		const transport = options.accountId
			? await this.getTransportForAccount(options.accountId)
			: this.defaultTransport;
		if (!transport) {
			return false;
		}
		// @ts-expect-error ts error
		const defaultFrom = transport._defaults.from;
		const headers: Record<string, string> = {};
		if (options.accountId) {
			headers['x-account-id'] = options.accountId;
		}
		if (options.responseId) {
			headers['x-response-id'] = options.responseId;
		}
		const result = await transport.sendMail({
			attachments: options.attachments?.map(({ content, contentType, filename }) => {
				return {
					content:
						content instanceof ReadableStream
							? // @ts-expect-error Node typings
								Readable.fromWeb(content)
							: content,
					contentType,
					filename
				};
			}),
			headers,
			text: options.text,
			from: options.from || defaultFrom,
			html: options.html,
			to: options.to,
			subject: options.subject
		});
		return !!result?.accepted?.length;
	}

	async sendTemplate(
		tpl: Template,
		vars: Record<string, unknown>,
		options: EmailServiceSendOptions
	) {
		const { attributes, html } = renderTemplate(tpl, vars);
		return this.send({
			...attributes,
			...options,
			html
		});
	}

	async sendTestEmail(smtpUrl: string, from: string, to: string) {
		const transport = nodemailer.createTransport(smtpUrl, {
			greetingTimeout: 6000,
			from
		});
		return transport.sendMail({
			text: 'This is a test email from Altcha.',
			to,
			subject: 'Test email'
		});
	}
}

export const emailService = new EmailService();

emailService.compileTemplates();
