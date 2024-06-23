import fsp from 'node:fs/promises';
import path from 'node:path';
import { and, asc, count, desc, eq, sql, inArray, or, type AnyColumn } from 'drizzle-orm';
import { EmailProcessor } from '$lib/server/processors/email.processor';
import { HttpProcessor } from '$lib/server/processors/http.processor';
import { SpamfilterProcessor } from '$lib/server/processors/spamfilter.processor';
import { StoreProcessor } from '$lib/server/processors/store.processor';
import { glob } from 'glob';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { accountsToUsers, forms, formsToUsers, responses } from '$lib/server/db/schema';
import { EIdPrefix, idgen } from '$lib/server/id';
import { ajv } from '$lib/server/validation';
import { ValidationError } from '$lib/server/errors';
import { accountsService } from '$lib/server/services/accounts.service';
import { plansService } from '$lib/server/services/plans.service';
import { EEvents, eventsService } from '$lib/server/services/events.service';
import { auditlogService } from '$lib/server/services/auditlog.service';
import type {
	IFormProcessor,
	TResponseData,
	IFormBlock,
	IFormTemplate,
	IReponseLogEntry,
	IPaginationOptions,
	IOrderByOptions
} from '$lib/types';
import type { RequestEvent } from '@sveltejs/kit';

export type IForm = NonNullable<Awaited<ReturnType<FormsService['findForm']>>>;

export type IFormSchema = typeof forms.$inferSelect;

interface IValidationSchema {
	format?: string;
	nullable?: boolean;
	type: string;
}

export class FormsService {
	readonly columns = {
		accountId: true,
		badges: true,
		banner: true,
		captchaAuto: true,
		captchaComplexity: true,
		captchaInvisible: true,
		confetti: true,
		contextInfo: true,
		createdAt: true,
		demo: true,
		displayBlocks: true,
		encryptionKeyHash: true,
		footer: true,
		hidePoweredBy: true,
		id: true,
		labels: true,
		locale: true,
		logo: true,
		mode: true,
		name: true,
		password: true,
		processors: true,
		receivedResponses: true,
		restricted: true,
		status: true,
		steps: true,
		submitLabel: true,
		success: true,
		successRedirect: true,
		updatedAt: true
	} as const satisfies Partial<Record<keyof IFormSchema, boolean>>;

	readonly templates = new Map<string, IFormTemplate[]>();

	createProcessorContext(form: IForm) {
		return new ProcessorContext(form);
	}

	generateId() {
		return idgen.prefixed(EIdPrefix.FORM);
	}

	getOrderBy(options: Partial<IOrderByOptions>) {
		const fn = options.orderDir === 'asc' ? asc : desc;
		switch (options.orderBy) {
			case 'name':
				return fn(forms.name);
			case 'id':
			default:
				return fn(forms.id);
		}
	}

	getTemplate(id: string) {
		const [_, locale] = id.split('.');
		return this.templates.get(locale)?.find((tpl) => tpl.id === id);
	}

	async countFormsForAccount(accountId: string) {
		const formsCount = await db
			.select({
				value: count()
			})
			.from(forms)
			.where(eq(forms.accountId, accountId));
		return formsCount[0].value;
	}

	async countResponsesForForms(accountId: string) {
		return db
			.select({
				count: count(responses.id),
				read: responses.read,
				spam: responses.spam,
				id: forms.id
			})
			.from(forms)
			.leftJoin(responses, eq(forms.id, responses.formId))
			.where(eq(forms.accountId, accountId))
			.groupBy(sql`${forms.id}, ${responses.read}, ${responses.spam}`)
			.orderBy(asc(forms.createdAt));
	}

	async createForm(
		data: Pick<IFormSchema, 'accountId' | 'name' | 'processors' | 'steps'> &
			Partial<Pick<IFormSchema, 'locale'>>
	) {
		const displayBlocks = data.steps[0]?.blocks[0]?.name;
		const [result] = await db
			.insert(forms)
			.values({
				accountId: data.accountId,
				id: this.generateId(),
				displayBlocks: displayBlocks ? [displayBlocks] : void 0,
				locale: data.locale,
				name: data.name,
				processors: data.processors,
				steps: data.steps
			})
			.returning({
				id: forms.id
			});
		return result;
	}

	async deleteForm(formId: string) {
		await db.delete(forms).where(eq(forms.id, formId));
	}

	async encryptFormData(
		form: Pick<IFormSchema, 'accountId' | 'encryptionKeyHash'>,
		data: TResponseData
	) {
		return accountsService.encryptData(form.accountId, data, form.encryptionKeyHash);
	}

	async findForm(formId: string) {
		const form = await db.query.forms.findFirst({
			columns: this.columns,
			where: eq(forms.id, formId),
			with: {
				account: {
					columns: accountsService.columns,
					with: {
						plan: {
							columns: plansService.columns
						}
					}
				},
				formsToUsers: {
					columns: {
						userId: true
					}
				}
			}
		});
		return form;
	}

	async findFormForApi(formId: string) {
		const form = await db.query.forms.findFirst({
			columns: this.columns,
			where: eq(forms.id, formId)
		});
		return form;
	}

	async incrementReceivedResponses(formId: string, num: number = 1) {
		await db
			.update(forms)
			.set({
				receivedResponses: sql`${forms.receivedResponses} + ${num}`
			})
			.where(eq(forms.id, formId));
	}

	async listFormsForUser(options: Partial<IPaginationOptions & IOrderByOptions> & { accountId: string, userId: string }) {
		return db
			.selectDistinctOn([forms.id, forms.name], {
				contextInfo: forms.contextInfo,
				id: forms.id,
				displayBlocks: forms.displayBlocks,
				labels: forms.labels,
				name: forms.name,
				receivedResponses: forms.receivedResponses,
				restricted: forms.restricted,
				status: forms.status
			})
			.from(forms)
			.orderBy(this.getOrderBy(options))
			.offset(options.offset || 0)
			.limit(options.limit || 500)
			.where(
				and(
					eq(forms.accountId, options.accountId),
					or(
						eq(forms.restricted, false),
						eq(accountsToUsers.role, 'admin'),
						eq(formsToUsers.userId, options.userId)
					)
				)
			)
			.leftJoin(formsToUsers, eq(formsToUsers.formId, forms.id))
			.leftJoin(accountsToUsers, eq(accountsToUsers.accountId, forms.accountId));
	}

	async listFormsForApi(options: IPaginationOptions & IOrderByOptions & { accountId: string }) {
		return db.query.forms.findMany({
			columns: {
				createdAt: true,
				id: true,
				name: true,
				status: true,
				updatedAt: true
			},
			offset: options.offset,
			orderBy: [this.getOrderBy(options)],
			limit: options.limit,
			where: eq(forms.accountId, options.accountId)
		});
	}

	async listFormUsers(formId: string) {
		return db.query.formsToUsers.findMany({
			columns: {
				createdAt: true
			},
			where: eq(formsToUsers.formId, formId),
			with: {
				user: {
					columns: {
						id: true,
						name: true
					}
				}
			}
		});
	}

	async readTemplates(globPath: string = 'templates/forms/**/*.json') {
		const files = await glob(globPath);
		for (const file of files) {
			const basename = path.basename(file, '.json');
			const [_, locale] = basename.split('.');
			if (!this.templates.has(locale)) {
				this.templates.set(locale, []);
			}
			this.templates.get(locale)!.push({
				...JSON.parse(await fsp.readFile(file, 'utf-8')),
				id: basename
			});
		}
	}

	async processData(
		context: ProcessorContext,
		data: TResponseData,
		processors: IFormProcessor[] = context.form.processors
	) {
		context.log(`Received data on node ${env.NODE_ID || '?'}`);
		context.log(
			`Executing ${processors.length} processors: ${processors.map(({ type }) => type).join(', ')}`
		);
		for (const processor of processors) {
			const startTime = performance.now();
			let error: any = null;
			context.log(`(${processor.type}) Start`);
			try {
				const inst = this.createProcessorInstance(processor);
				await inst.run(context, data);
			} catch (err) {
				error = err;
				if (processor.config.terminateOnFailure !== false) {
					context.log(`Terminating data processing due to failure`);
					break;
				}
			} finally {
				const duration = Math.floor((performance.now() - startTime) * 100) / 100;
				if (error) {
					context.log(`(${processor.type}) ${error.message}`, void 0, true);
				}
				context.log(
					`(${processor.type}) ${error ? 'Failure' : 'Success'}, ${duration}ms`,
					void 0,
					!!error
				);
				if (context.terminate) {
					context.log(`(${processor.type}) Forcefully terminating data processing`);
					break;
				}
			}
		}
		return {
			context,
			data
		};
	}

	async trackDeleteEvent(event: RequestEvent, form: IForm) {
		await eventsService.trackEvent({
			account: form.account,
			event: EEvents.FORMS_DELETE,
			ipAddress: event.locals.remoteAddress,
			user: event.locals.user
		});
	}

	async trackUpdateEvent(event: RequestEvent, form: IForm, data: Partial<IFormSchema>) {
		await eventsService.trackEvent({
			account: form.account,
			data: {
				changes: auditlogService.getChanges(form, data)
			},
			event: EEvents.FORMS_UPDATE,
			ipAddress: event.locals.remoteAddress,
			user: event.locals.user
		});
	}

	async updateForm(
		formId: string,
		data: Partial<
			Pick<
				IForm,
				| 'banner'
				| 'badges'
				| 'captchaAuto'
				| 'captchaComplexity'
				| 'captchaInvisible'
				| 'confetti'
				| 'contextInfo'
				| 'displayBlocks'
				| 'encryptionKeyHash'
				| 'footer'
				| 'hidePoweredBy'
				| 'labels'
				| 'locale'
				| 'logo'
				| 'mode'
				| 'name'
				| 'password'
				| 'processors'
				| 'restricted'
				| 'status'
				| 'steps'
				| 'submitLabel'
				| 'success'
				| 'successRedirect'
			>
		>
	) {
		await db
			.update(forms)
			.set({
				banner: data.banner,
				badges: data.badges,
				captchaAuto: data.captchaAuto,
				captchaComplexity: data.captchaComplexity,
				captchaInvisible: data.captchaInvisible,
				confetti: data.confetti,
				contextInfo: data.contextInfo,
				displayBlocks: data.displayBlocks,
				encryptionKeyHash: data.encryptionKeyHash,
				footer: data.footer,
				hidePoweredBy: data.hidePoweredBy,
				labels: data.labels,
				locale: data.locale,
				logo: data.logo,
				mode: data.mode,
				name: data.name,
				password: data.password,
				processors: data.processors,
				restricted: data.restricted,
				status: data.status,
				steps: data.steps,
				submitLabel: data.submitLabel,
				success: data.success,
				successRedirect: data.successRedirect,
				updatedAt: new Date()
			})
			.where(eq(forms.id, formId));
	}

	async upsertFormUsers(formId: string, userIds: string[]) {
		const oldUserIds = (
			await db.query.formsToUsers.findMany({
				columns: {
					userId: true
				},
				where: eq(formsToUsers.formId, formId)
			})
		).map(({ userId }) => userId);
		const toDelete = oldUserIds.filter((userId) => !userIds.includes(userId));
		const toInsert = userIds.filter((userId) => !oldUserIds.includes(userId));
		if (toDelete.length) {
			await db
				.delete(formsToUsers)
				.where(and(eq(formsToUsers.formId, formId), inArray(formsToUsers.userId, toDelete)));
		}
		if (toInsert.length) {
			await db.insert(formsToUsers).values(
				toInsert.map((userId) => {
					return {
						formId,
						userId
					};
				})
			);
		}
	}

	validate(form: IForm, data: TResponseData) {
		const schema = this.createValidationSchema(form);
		const validate = ajv.compile(schema);
		const valid = validate(data);
		if (!valid) {
			throw new ValidationError(void 0, validate.errors!);
		}
		return data;
	}

	protected createValidationSchema(form: IForm) {
		const properties: Record<string, IValidationSchema> = {};
		const required: string[] = [];
		for (const step of form.steps) {
			for (const block of step.blocks) {
				const prop = this.createValidationSchemaProperty(block);
				if (block.required) {
					required.push(block.name);
				}
				properties[block.name] = prop;
			}
		}
		return {
			additionalProperties: false,
			properties,
			required,
			type: 'object'
		};
	}

	protected createValidationSchemaProperty(block: IFormBlock): IValidationSchema {
		let format: string | undefined = void 0;
		let type: string = 'string';
		switch (block.type) {
			case 'CheckboxInput':
			case 'ToggleInput':
				type = 'boolean';
				break;
			case 'NumberInput':
			case 'RatingInput':
				type = 'number';
				break;
			default:
				type = 'string';
				break;
		}
		switch (block.type) {
			case 'DateTimeInput':
				format = block.options.datetime ? 'date-time' : 'date';
				break;
			case 'EmailInput':
				format = 'email';
				break;
			case 'UrlInput':
				format = 'uri';
				break;
		}
		return {
			format,
			nullable: block.required !== true,
			type
		};
	}

	protected createProcessorInstance(processor: IFormProcessor) {
		switch (processor.type) {
			case 'email':
				return new EmailProcessor(processor.config);
			case 'http':
				return new HttpProcessor(processor.config);
			case 'spamfilter':
				return new SpamfilterProcessor(processor.config);
			case 'store':
				return new StoreProcessor(processor.config);
			default:
				throw new Error(`Unkwnon processor type ${processor.type}.`);
		}
	}
}

export class ProcessorContext {
	readonly metadata = new Map<string, unknown>();

	readonly logs: IReponseLogEntry[] = [];

	emailBlockName: string | null = null;

	responseId: string | undefined = void 0;

	spam: boolean = false;

	store: boolean = false;

	/**
	 * Retention in days
	 */
	retention: number = 0;

	terminate: boolean = false;

	constructor(readonly form: IForm) {
		this.emailBlockName = form.steps.reduce(
			(acc, step) => {
				if (!acc) {
					for (const block of step.blocks) {
						if (block.type === 'EmailInput') {
							return block.name;
						}
					}
				}
				return acc;
			},
			null as string | null
		);
	}

	log(text: string, data?: Record<string, unknown>, error?: boolean) {
		this.logs.push({
			error,
			time: Date.now(),
			text,
			data
		});
	}

	get<T>(key: string): T | null {
		return this.metadata.get(key) as T;
	}

	set<T>(key: string, value: T) {
		this.metadata.set(key, value);
	}
}

export const formsService = new FormsService();

formsService.readTemplates();
