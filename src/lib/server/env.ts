import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { building } from '$app/environment';
import { Type as t } from '@sinclair/typebox';
import { compileSchema, validateSchema } from './validation.js';
import { ValidationError } from './errors.js';
import type { Static, TSchema } from '@sinclair/typebox';

const VERSION = process.env.npm_package_version || '0.0.0';
const RAND_NODE_ID = `${process.env.REGION || ''}${randomBytes(3).toString('hex')}`;

export const schema = t.Object({
	// Application configuration variables
	/**
	 * Comma-separated list of available regions
	 */
	AVAILABLE_REGIONS: t.String({
		default: ''
	}),
	/**
	 * Base URL for the application, where the application will be accessible at. Can contain variable `_region_` which will get replaced with the current REGION.
	 */
	BASE_URL: t.String({
		default: 'http://localhost',
		format: 'uri'
	}),
	/**
	 * URL for privacy policy
	 */
	PRIVACY_POLICY_URL: t.String({
		default: 'https://altcha.org/privacy-policy'
	}),
	/**
	 * Default (current) region of the application
	 */
	REGION: t.String({
		default: ''
	}),
	/**
	 * URL for terms of service
	 */
	TERMS_OF_SERVICE_URL: t.String({
		default: 'https://altcha.org/terms-of-service'
	}),
	/**
	 * Application version
	 */
	VERSION: t.String({
		default: VERSION
	}),

	// Database configuration variables
	/**
	 * URL for the database connection
	 */
	DATABASE_URL: t.String({
		default: getDefaultDatabaseUrl(),
		format: 'uri'
	}),

	// License information
	/**
	 * Base64-encoded license key
	 */
	LICENSE: t.Optional(t.String()),
	/**
	 * Flag to hide license information (1: hide, 0: show)
	 */
	LICENSE_HIDE: t.String({
		default: '0',
		pattern: '^1|0$'
	}),

	// Emergency access settings
	/**
	 * Flag to enable emergency access (1: disabled, 0: enabled)
	 */
	EMERGENCY_ACCESS_DISABLED: t.String({
		default: '0',
		pattern: '^1|0$'
	}),
	/**
	 * Comma-separated list of emails to send the notification to when the emergency access is activated
	 */
	EMERGENCY_ACCESS_NOTIFY: t.Optional(t.String()),
	/**
	 * Secret key for emergency access. The log-in page will be available at /app/emergency/[EMERGENCY_ACCESS_SECRET].
	 */
	EMERGENCY_ACCESS_SECRET: t.Optional(
		t.String({
			minLength: 8
		})
	),

	// Job scheduling configurations
	/**
	 * Cron expression for deleting expired devices
	 */
	JOBS_DELETE_EXPIRED_DEVICED: t.String({
		default: '0 2 * * *'
	}),
	/**
	 * Cron expression for deleting expired responses
	 */
	JOBS_DELETE_EXPIRED_RESPONSES: t.String({
		default: '0 3 * * *'
	}),
	/**
	 * Cron expression for deleting expired files
	 */
	JOBS_DELETE_EXPIRED_FILES: t.String({
		default: '0 4 * * *'
	}),
	/**
	 * Flag to disable job scheduling (1: disabled, 0: enabled)
	 */
	JOBS_DISABLED: t.String({
		default: '0',
		pattern: '^1|0$'
	}),

	// Usage limits
	/**
	 * Limit on the number of free accounts per user
	 */
	LIMIT_FREE_ACCOUNTS_PER_USER: t.String({
		default: '3'
	}),

	// Node configuration
	/**
	 * Unique identifier for the node
	 */
	NODE_ID: t.Optional(
		t.String({
			default: RAND_NODE_ID
		})
	),

	// OAuth configurations
	/**
	 * Google OAuth client ID
	 */
	OAUTH_GOOGLE_CLIENT_ID: t.Optional(t.String()),
	/**
	 * Google OAuth client secret
	 */
	OAUTH_GOOGLE_CLIENT_SECRET: t.Optional(t.String()),
	/**
	 * GitHub OAuth client ID
	 */
	OAUTH_GITHUB_CLIENT_ID: t.Optional(t.String()),
	/**
	 * GitHub OAuth client secret
	 */
	OAUTH_GITHUB_CLIENT_SECRET: t.Optional(t.String()),

	// Paddle payment gateway configurations
	/**
	 * Paddle API key
	 */
	PADDLE_API_KEY: t.Optional(t.String()),
	/**
	 * Paddle client token
	 */
	PADDLE_CLIENT_TOKEN: t.Optional(t.String()),
	/**
	 * Paddle environment (sandbox/production)
	 */
	PADDLE_ENV: t.Optional(t.String()),
	/**
	 * Paddle webhook secret key
	 */
	PADDLE_WEBHOOK_SECRET_KEY: t.Optional(t.String()),

	// Rate limit settings
	/**
	 * Level 1 rate limit (requests per minute)
	 */
	RATE_LIMIT_L1: t.String({
		default: '600/60'
	}),
	/**
	 * Level 2 rate limit (requests per minute)
	 */
	RATE_LIMIT_L2: t.String({
		default: '200/60'
	}),
	/**
	 * Level 3 rate limit (requests per minute)
	 */
	RATE_LIMIT_L3: t.String({
		default: '100/60'
	}),

	// Spam filter API configurations
	/**
	 * Headers for spam filter requests
	 */
	SPAM_FILTER_HEADERS: t.Optional(t.String()),
	/**
	 * URL for the spam filter API
	 */
	SPAM_FILTER_URL: t.Optional(
		t.String({
			format: 'uri'
		})
	),

	// Security settings (JWT, HMAC)
	/**
	 * Device cookie expiration time (as a human readable duration, https://github.com/jkroso/parse-duration)
	 */
	DEVICE_COOKIE_EXPIRES: t.String({
		default: '90d'
	}),
	/**
	 * JWT issuer identifier
	 */
	JWT_ISSUER: t.String({
		default: 'AltchaForms'
	}),
	/**
	 * Flag to disable passkeys (1: disabled, 0: enabled)
	 */
	PASSKEYS_DISABLED: t.String({
		default: '0',
		pattern: '^1|0$'
	}),
	/**
	 * Flag to disable new registrations (1: disabled, 0: enabled)
	 */
	REGISTRATIONS_DISABLED: t.String({
		default: '0',
		pattern: '^1|0$'
	}),
	/**
	 * Secret key for signing JWTs and HMAC
	 */
	SIGNING_SECRET: t.String({
		minLength: 24
	}),

	// Email configurations
	/**
	 * SMTP server URL
	 */
	SMTP_URL: t.Optional(
		t.String({
			format: 'uri'
		})
	),
	/**
	 * Default sender email address
	 */
	SMTP_SENDER: t.Optional(t.String()),

	// File storage settings
	/**
	 * Storage provider (e.g., 'fs', 's3')
	 */
	STORAGE_PROVIDER: t.String({
		default: 'fs'
	}),
	/**
	 * Directory path for file system storage
	 */
	STORAGE_FS_DIR: t.String({
		default: './data'
	}),
	/**
	 * AWS S3 access key ID
	 */
	STORAGE_S3_ACCESS_KEY_ID: t.Optional(t.String()),
	/**
	 * AWS S3 bucket name
	 */
	STORAGE_S3_BUCKET: t.Optional(t.String()),
	/**
	 * AWS S3 endpoint URL
	 */
	STORAGE_S3_ENDPOINT: t.Optional(t.String()),
	/**
	 * AWS S3 secret access key
	 */
	STORAGE_S3_SECRET_ACCESS_KEY: t.Optional(t.String()),
	/**
	 * AWS S3 region
	 */
	STORAGE_S3_REGION: t.Optional(t.String()),

	// Redis configurations
	/**
	 * Redis server URL
	 */
	REDIS_URL: t.Optional(
		t.String({
			format: 'uri'
		})
	),

	// User access recovery settings
	/**
	 * Enforced delay for user recovery token requests (as a human readable duration, https://github.com/jkroso/parse-duration)
	 */
	USER_RECOVERY_TOKEN_DELAY: t.String({
		default: '10min'
	}),
	/**
	 * Throttle time for user recovery requests (as a human readable duration, https://github.com/jkroso/parse-duration)
	 */
	USER_RECOVERY_THROTTLE: t.String({
		default: '1h'
	}),

	// Webhook configurations
	/**
	 * Secret token for securing webhooks
	 */
	WEBHOOKS_SECRET_TOKEN: t.Optional(
		t.String({
			minLength: 24
		})
	)
});

export const env: Static<typeof schema> = !building
	? assertEnv(schema)
	: ({} as Static<typeof schema>);

export function assertEnv<T extends TSchema>(schema: T): Static<T> {
	let result: Record<string, string | undefined> = {};
	try {
		result = validateSchema(compileSchema(schema), { ...process.env }) as typeof env;
	} catch (err) {
		throw new ValidationError(
			'Env: ' + err,
			typeof err === 'object' && err && 'details' in err && Array.isArray(err.details)
				? err.details
				: []
		);
	}
	return result;
}

export function getAppBaseUrl(region = env.REGION) {
	return String(env.BASE_URL).replace('_region_', region);
}

function getDefaultDatabaseUrl() {
	if (process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD) {
		return `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || 'postgres'}/${process.env.POSTGRES_DB}`;
	}
	return void 0;
}
