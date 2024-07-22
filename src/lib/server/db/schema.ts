import {
	pgEnum,
	pgTable,
	primaryKey,
	timestamp,
	varchar,
	integer,
	boolean,
	index,
	unique,
	text,
	customType
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import type {
	IFormProcessor,
	IFormStep,
	ILabel,
	IPlanPrice,
	IReponseLogEntry,
	TResponseData,
	WebAuthnAuthenticator
} from '$lib/types';

export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'declined', 'accepted']);

export const formModeEnum = pgEnum('form_mode', ['standard', 'guided', 'hidden']);

export const formStatusEnum = pgEnum('form_status', ['draft', 'published', 'archived']);

export const complexityEnum = pgEnum('complexity', ['low', 'medium', 'high']);

export const auditlogEnum = pgEnum('auditlog', ['changes', 'access']);

export const billingCycleEnum = pgEnum('billing_cycle', ['month', 'year']);

export const suspendedEnum = pgEnum('suspended', [
	'trial_expired',
	'subscription_expired',
	'billing_problem',
	'terms_violation',
	'other'
]);

// https://github.com/drizzle-team/drizzle-orm/pull/666#issuecomment-1809339114
export const customJson = <TData>(name: string) =>
	customType<{ data: TData; driverData: TData }>({
		dataType() {
			return 'json';
		},
		toDriver(val: TData) {
			return sql`(((${JSON.stringify(val)})::jsonb)#>> '{}')::jsonb`;
		},
		fromDriver(value): TData {
			return value as TData;
		}
	})(name);

export const accounts = pgTable('accounts', {
	id: varchar('id', { length: 32 }).primaryKey(),
	planId: varchar('plan_id', { length: 32 }).references(() => plans.id, {
		onDelete: 'set null'
	}),
	auditlog: auditlogEnum('auditlog'),
	auditlogRetention: integer('auditlog_retention'),
	billingCycle: billingCycleEnum('billing_cycle').default('year'),
	canSendEmails: boolean('can_send_emails').default(true),
	encryptionEnabled: boolean('encryption_enabled').notNull().default(true),
	name: varchar('name', { length: 256 }).notNull(),
	smtpUrl: varchar('smtp_url', { length: 256 }),
	smtpSender: varchar('smtp_sender', { length: 64 }),
	suspended: suspendedEnum('suspended'),
	timeZone: varchar('time_zone', { length: 64 }),
	trialExpiresAt: timestamp('trial_expires_at'),
	responses: integer('responses').notNull().default(0),
	uploads: integer('uploads').notNull().default(0),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => {
	return {
		trialExpiresAtIdx: index('accounts_trial_expires_at_idx').on(table.trialExpiresAt)
	};
});

export const apiKeys = pgTable(
	'api_keys',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		deleted: boolean('deleted').default(false),
		features: customJson('features')
			.notNull()
			.default('[]')
			.$type<Array<'forms_api' | 'antispam_api'>>(),
		name: varchar('name', { length: 64 }).notNull(),
		referrer: varchar('referrer', { length: 1024 }).notNull(),
		secret: varchar('secret', { length: 64 }).notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		deletedAt: timestamp('deleted_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			deletedIdx: index('api_keys_deleted_idx').on(table.deleted)
		};
	}
);

export const encryptionKeys = pgTable(
	'encryption_keys',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		deleted: boolean('deleted').default(false),
		hash: varchar('hash', { length: 24 }).notNull(),
		publicKey: text('public_key').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		deletedAt: timestamp('deleted_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			deletedIdx: index('encryption_keys_deleted_idx').on(table.deleted)
		};
	}
);

export const users = pgTable(
	'users',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		deleted: boolean('deleted').default(false),
		email: varchar('email', { length: 256 }).unique(),
		emailVerified: boolean('email_verified').notNull().default(false),
		emailVerificationToken: varchar('email_verification_token', { length: 64 }),
		emergency: boolean('emergency').notNull().default(false),
		emergencyPassword: varchar('emergency_password', { length: 128 }),
		jwtNonce: varchar('jwt_nonce', { length: 16 }).notNull(),
		locale: varchar('locale', { length: 8 }).notNull().default('en-GB'),
		name: varchar('name', { length: 64 }).notNull(),
		oauthProvider: varchar('oauth_provider', { length: 32 }),
		oauthAccessToken: varchar('oauth_access_token', { length: 256 }),
		oauthProfile: customJson('oauth_profile'),
		recoveryPassphrase: varchar('recovery_passphrase', { length: 256 }),
		recoveryPassphraseHint: varchar('recovery_passphrase_hint', { length: 64 }),
		recoveryToken: varchar('recovery_token', { length: 64 }),
		recoveryRequestedAt: timestamp('recovery_requested_at'),
		webauthnAuthenticators: customJson('webauthn_authenticators')
			.notNull()
			.$type<WebAuthnAuthenticator[]>(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		deletedAt: timestamp('deleted_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			deletedIdx: index('users_deleted_idx').on(table.deleted)
		};
	}
);

export const devices = pgTable(
	'devices',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		userId: varchar('user_id', { length: 32 })
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		encryptionKey: varchar('encryption_key', { length: 64 }).notNull(),
		ipAddress: varchar('ip_address', { length: 64 }).notNull(),
		name: varchar('name', { length: 64 }).notNull(),
		timezone: varchar('timezone', { length: 64 }).notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		expiresAt: timestamp('expires_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			expiresAtIdx: index('devices_expires_at_idx').on(table.expiresAt)
		};
	}
);

export const invites = pgTable(
	'invites',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		email: varchar('email', { length: 256 }).notNull(),
		invitedBy: varchar('invited_by', { length: 32 })
			.notNull()
			.references(() => users.id),
		role: userRoleEnum('role').notNull().default('member'),
		status: inviteStatusEnum('status').notNull().default('pending'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			emailIdx: unique('account_id_email_idx').on(table.accountId, table.email)
		};
	}
);

export const forms = pgTable('forms', {
	id: varchar('id', { length: 32 }).primaryKey(),
	accountId: varchar('account_id', { length: 32 })
		.notNull()
		.references(() => accounts.id, {
			onDelete: 'cascade'
		}),
	badges: customJson('badges').notNull().default('[]').$type<string[]>(),
	banner: varchar('banner', { length: 32 }),
	captchaAuto: boolean('captcha_auto').notNull().default(false),
	captchaComplexity: complexityEnum('captcha_complexity').notNull().default('medium'),
	captchaFloating: boolean('captcha_floating').notNull().default(false),
	captchaInvisible: boolean('captcha_invisible').notNull().default(true),
	confetti: boolean('confetti').notNull().default(false),
	contextInfo: boolean('context_info').notNull().default(true),
	demo: boolean('demo').notNull().default(false),
	displayBlocks: customJson('display_blocks').notNull().default('[]').$type<string[]>(),
	encryptionKeyHash: varchar('encryption_key_hash'),
	footer: varchar('footer', { length: 1024 }),
	hidePoweredBy: boolean('hide_powered_by').notNull().default(false),
	labels: customJson('labels').$type<ILabel[]>(),
	locale: varchar('locale', { length: 8 }).notNull().default('en-GB'),
	logo: varchar('logo', { length: 32 }),
	mode: formModeEnum('mode').notNull().default('standard'),
	name: varchar('name', { length: 256 }).notNull(),
	password: varchar('password', { length: 64 }),
	processors: customJson('processors').notNull().$type<IFormProcessor[]>(),
	receivedResponses: integer('received_responses').notNull().default(0),
	restricted: boolean('restricted').notNull().default(false),
	status: formStatusEnum('status').notNull().default('draft'),
	steps: customJson('steps').notNull().$type<IFormStep[]>(),
	submitLabel: varchar('submit_label', { length: 128 }),
	success: varchar('success', { length: 1024 }),
	successRedirect: varchar('success_redirect', { length: 256 }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const responses = pgTable(
	'responses',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		formId: varchar('form_id', { length: 32 })
			.notNull()
			.references(() => forms.id, {
				onDelete: 'cascade'
			}),
		identityId: varchar('identity_id', { length: 32 }).references(() => identities.id, {
			onDelete: 'cascade'
		}),
		context: customJson('context').notNull().$type<Record<string, unknown>>(),
		data: customJson('data').$type<TResponseData>(),
		dataEncrypted: text('data_encrypted'),
		deleted: boolean('deleted').default(false),
		encrypted: boolean('encrypted').notNull().default(false),
		encryptionKeyHash: varchar('encryption_key_hash'),
		error: boolean('error').default(false),
		flag: boolean('flag').default(false),
		labels: customJson('labels').$type<string[]>(),
		logs: customJson('logs').notNull().$type<IReponseLogEntry[]>(),
		read: boolean('read').default(false),
		spam: boolean('spam').default(false),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		deletedAt: timestamp('deleted_at'),
		expiresAt: timestamp('expires_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			flagIdx: index('responses_flag_idx').on(table.flag),
			errorIdx: index('responses_error_idx').on(table.error),
			expiresAtIdx: index('responses_expires_at_idx').on(table.expiresAt),
			readIdx: index('responses_read_idx').on(table.read),
			spamIdx: index('responses_spam_idx').on(table.spam)
		};
	}
);

export const identities = pgTable(
	'identities',
	{
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		id: varchar('id', { length: 32 }).primaryKey(),
		encrypted: boolean('encrypted').notNull().default(false),
		encryptionKeyHash: varchar('encryption_key_hash'),
		externalId: varchar('external_id', { length: 256 }).notNull(),
		metadata: customJson('metadata').$type<Record<string, unknown>>(),
		metadataEncrypted: text('metadata_encrypted'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			externalIdIdx: unique('identities_account_id_external_id_idx').on(
				table.accountId,
				table.externalId
			)
		};
	}
);

export const notes = pgTable('notes', {
	id: varchar('id', { length: 32 }).primaryKey(),
	accountId: varchar('account_id', { length: 32 })
		.notNull()
		.references(() => accounts.id, {
			onDelete: 'cascade'
		}),
	formId: varchar('form_id', { length: 32 })
		.notNull()
		.references(() => forms.id, {
			onDelete: 'cascade'
		}),
	responseId: varchar('response_id', { length: 32 })
		.notNull()
		.references(() => responses.id, {
			onDelete: 'cascade'
		}),
	userId: varchar('user_id', { length: 32 }).references(() => users.id, {
		onDelete: 'set null'
	}),
	encrypted: boolean('encrypted').notNull().default(false),
	encryptionKeyHash: varchar('encryption_key_hash'),
	from: varchar('from', { length: 256 }),
	read: boolean('read').notNull().default(true),
	sentToEmailAt: timestamp('sent_to_email_at'),
	text: text('text'),
	textEncrypted: text('text_encrypted'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const files = pgTable(
	'files',
	{
		id: varchar('id', { length: 32 }).primaryKey(),
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		formId: varchar('form_id', { length: 32 })
			.notNull()
			.references(() => forms.id, {
				onDelete: 'cascade'
			}),
		responseId: varchar('response_id', { length: 32 }).references(() => responses.id, {
			onDelete: 'cascade'
		}),
		encrypted: boolean('encrypted').notNull().default(false),
		encryptionKeyHash: varchar('encryption_key_hash'),
		encryptedSize: integer('encrypted_size'),
		finalized: boolean('finalized').notNull().default(true),
		name: varchar('name', { length: 256 }).notNull(),
		persistent: boolean('persistent').default(false),
		public: boolean('public').default(false),
		size: integer('size').notNull(),
		type: varchar('type', { length: 64 }).notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		expiresAt: timestamp('expires_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			expiresAtIdx: index('files_expires_at_idx').on(table.expiresAt)
		};
	}
);

export const plans = pgTable('plans', {
	id: varchar('id', { length: 120 }).primaryKey(),
	auditlogMaxRetention: integer('auditlog_max_retention').notNull().default(365),
	default: boolean('default').default(false).notNull(),
	deprecated: boolean('deprecated').default(false).notNull(),
	featureAnalytics: boolean('feature_analytics').default(true).notNull(),
	featureAuditlog: boolean('feature_auditlog').default(true).notNull(),
	featureFiles: boolean('feature_files').default(true).notNull(),
	featureForms: boolean('feature_forms').default(true).notNull(),
	featureNotes: boolean('feature_notes').default(true).notNull(),
	featureProcessors: boolean('feature_processors').default(true).notNull(),
	group: varchar('group', { length: 64 }),
	hidden: boolean('hidden').notNull().default(false),
	limitApi: integer('limit_api').notNull().default(100000),
	limitApiKeys: integer('limit_api_keys').notNull().default(10),
	limitEncryptionKeys: integer('limit_encryption_keys').notNull().default(10),
	limitFileSize: integer('limit_file_size').notNull().default(10),
	limitForms: integer('limit_forms').notNull().default(10),
	limitResponses: integer('limit_responses'),
	limitUploads: integer('limit_uploads'),
	limitUsers: integer('limit_users').notNull().default(10),
	name: varchar('name', { length: 32 }).notNull(),
	premium: boolean('premium').default(true).notNull(),
	prices: customJson('prices').notNull().$type<IPlanPrice[]>(),
	trialDays: integer('trial_days'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const subscriptions = pgTable('subscriptions', {
	id: varchar('id', { length: 120 }).primaryKey(),
	accountId: varchar('account_id', { length: 32 })
		.notNull()
		.references(() => accounts.id, {
			onDelete: 'cascade'
		}),
	planId: varchar('plan_id', { length: 32 }).references(() => plans.id, {
		onDelete: 'set null'
	}),
	auto: boolean('auto').default(true).notNull(),
	cancelUrl: varchar('cancel_url', { length: 1024 }),
	eventPayload: customJson('event_payload').$type<Record<string, unknown>>(),
	status: varchar('status', { length: 64 }).notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	lastEventAt: timestamp('last_event_at'),
	nextBillingAt: timestamp('next_billing_at'),
	paidUntil: timestamp('paid_until'),
	updateUrl: varchar('update_url', { length: 1024 }),
	expiresAt: timestamp('expires_at'),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
	id: varchar('id', { length: 32 }).primaryKey(),
	formId: varchar('form_id', { length: 32 })
		.notNull()
		.references(() => forms.id, {
			onDelete: 'cascade'
		}),
	responseId: varchar('response_id', { length: 32 }).references(() => responses.id, {
		onDelete: 'cascade'
	}),
	abondoned: boolean('abondoned').notNull().default(false),
	completionTime: integer('completion_time'),
	country: varchar('country', { length: 2 }),
	correction: integer('correction').notNull().default(0),
	error: boolean('error'),
	fieldDropOff: varchar('field_drop_off', { length: 120 }),
	fields: customJson('fields').$type<[string, number, number, number][]>(),
	mobile: boolean('mobile').notNull().default(false),
	startAt: timestamp('start_at').notNull().defaultNow(),
	submitAt: timestamp('submit_at')
});

export const sessionsCompacted = pgTable(
	'sessions_compacted',
	{
		formId: varchar('form_id', { length: 32 })
			.notNull()
			.references(() => forms.id, {
				onDelete: 'cascade'
			}),
		date: timestamp('date').notNull(),
		data: customJson('data').notNull().$type<unknown[]>()
	},
	(t) => ({
		pk: primaryKey({
			columns: [t.formId, t.date]
		})
	})
);

export const auditlog = pgTable(
	'audit_log',
	{
		id: varchar('id', { length: 120 }).primaryKey(),
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		deviceId: varchar('device_id', { length: 32 }).references(() => devices.id, {
			onDelete: 'cascade'
		}),
		formId: varchar('form_id', { length: 32 }).references(() => forms.id, {
			onDelete: 'cascade'
		}),
		responseId: varchar('response_id', { length: 32 }).references(() => responses.id, {
			onDelete: 'cascade'
		}),
		userId: varchar('user_id', { length: 32 }).references(() => users.id, {
			onDelete: 'cascade'
		}),
		data: customJson('data').$type<Record<string, unknown>>(),
		dataEncrypted: text('data_encrypted'),
		description: varchar('description', { length: 250 }),
		encrypted: boolean('encrypted').notNull().default(false),
		encryptionKeyHash: varchar('encryption_key_hash'),
		event: varchar('event', { length: 64 }).notNull(),
		ipAddress: varchar('ip_address', { length: 64 }),
		nodeId: varchar('node_id', { length: 64 }),
		version: varchar('version', { length: 32 }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		expiresAt: timestamp('expires_at'),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(table) => {
		return {
			eventIdx: index('auditlog_event_idx').on(table.event),
			expiresAtIdx: index('auditlog_expires_at_idx').on(table.expiresAt)
		};
	}
);

export const accountsToUsers = pgTable(
	'accounts_to_users',
	{
		accountId: varchar('account_id', { length: 32 })
			.notNull()
			.references(() => accounts.id, {
				onDelete: 'cascade'
			}),
		userId: varchar('user_id', { length: 32 })
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		role: userRoleEnum('role').notNull().default('admin'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow()
	},
	(t) => ({
		pk: primaryKey({
			columns: [t.accountId, t.userId]
		})
	})
);

export const formsToUsers = pgTable(
	'forms_to_users',
	{
		formId: varchar('form_id', { length: 32 })
			.notNull()
			.references(() => forms.id, {
				onDelete: 'cascade'
			}),
		userId: varchar('user_id', { length: 32 })
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade'
			}),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({
		pk: primaryKey({
			columns: [t.formId, t.userId]
		})
	})
);

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
	account: one(accounts, {
		fields: [apiKeys.accountId],
		references: [accounts.id]
	})
}));

export const devicesRelations = relations(devices, ({ one }) => ({
	user: one(users, {
		fields: [devices.userId],
		references: [users.id]
	})
}));

export const encryptionKeyRelations = relations(encryptionKeys, ({ one }) => ({
	account: one(accounts, {
		fields: [encryptionKeys.accountId],
		references: [accounts.id]
	})
}));

export const filesRelations = relations(files, ({ one }) => ({
	account: one(accounts, {
		fields: [files.accountId],
		references: [accounts.id]
	}),
	form: one(forms, {
		fields: [files.formId],
		references: [forms.id]
	}),
	response: one(responses, {
		fields: [files.responseId],
		references: [responses.id]
	})
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
	account: one(accounts, {
		fields: [forms.accountId],
		references: [accounts.id]
	}),
	responses: many(responses),
	formsToUsers: many(formsToUsers)
}));

export const invitesRelations = relations(invites, ({ one }) => ({
	account: one(accounts, {
		fields: [invites.accountId],
		references: [accounts.id]
	}),
	inviter: one(users, {
		fields: [invites.invitedBy],
		references: [users.id]
	})
}));

export const responsesRelations = relations(responses, ({ many, one }) => ({
	account: one(accounts, {
		fields: [responses.accountId],
		references: [accounts.id]
	}),
	files: many(files),
	form: one(forms, {
		fields: [responses.formId],
		references: [forms.id]
	}),
	identity: one(identities, {
		fields: [responses.identityId],
		references: [identities.id]
	}),
	notes: many(notes)
}));

export const identitiesRelations = relations(identities, ({ one, many }) => ({
	account: one(accounts, {
		fields: [identities.accountId],
		references: [accounts.id]
	}),
	response: many(responses)
}));

export const notesRelations = relations(notes, ({ one }) => ({
	account: one(accounts, {
		fields: [notes.accountId],
		references: [accounts.id]
	}),
	form: one(forms, {
		fields: [notes.formId],
		references: [forms.id]
	}),
	response: one(responses, {
		fields: [notes.responseId],
		references: [responses.id]
	}),
	user: one(users, {
		fields: [notes.userId],
		references: [users.id]
	})
}));

export const auditlogRelations = relations(auditlog, ({ one }) => ({
	account: one(accounts, {
		fields: [auditlog.accountId],
		references: [accounts.id]
	}),
	form: one(forms, {
		fields: [auditlog.formId],
		references: [forms.id]
	}),
	response: one(responses, {
		fields: [auditlog.responseId],
		references: [responses.id]
	}),
	user: one(users, {
		fields: [auditlog.userId],
		references: [users.id]
	})
}));

export const accountsRelations = relations(accounts, ({ many, one }) => ({
	accountsToUsers: many(accountsToUsers),
	plan: one(plans, {
		fields: [accounts.planId],
		references: [plans.id]
	})
}));

export const usersRelations = relations(users, ({ many }) => ({
	accountsToUsers: many(accountsToUsers),
	formsToUsers: many(formsToUsers)
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	account: one(accounts, {
		fields: [subscriptions.accountId],
		references: [accounts.id]
	}),
	plan: one(plans, {
		fields: [subscriptions.planId],
		references: [plans.id]
	})
}));

export const accountsToUsersRelations = relations(accountsToUsers, ({ one }) => ({
	account: one(accounts, {
		fields: [accountsToUsers.accountId],
		references: [accounts.id]
	}),
	user: one(users, {
		fields: [accountsToUsers.userId],
		references: [users.id]
	})
}));

export const formsToUsersRelations = relations(formsToUsers, ({ one }) => ({
	form: one(forms, {
		fields: [formsToUsers.formId],
		references: [forms.id]
	}),
	user: one(users, {
		fields: [formsToUsers.userId],
		references: [users.id]
	})
}));
