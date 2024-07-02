import { fail, redirect } from '@sveltejs/kit';
import { compileSchema, validateSchema, type ValidateFunction } from '$lib/server/validation';
import { BaseError, UnauthorizedError, ValidationError } from '$lib/server/errors';
import { checkUserAccountAccess } from '$lib/server/helpers';
import type { TSchema, Static } from '@sinclair/typebox';
import type { RequestEvent } from '@sveltejs/kit';
import type { IUser } from '$lib/server/services/users.service';
import type { IApiKey } from './services/apiKeys.service';
import { rateLimit, rateLimitLevels } from './ratelimiter';

export type TAuthorization = boolean | 'apiKey';

export interface ActionHandlerOptions<
	Authorization extends TAuthorization,
	BodySchema extends TSchema,
	SearchParamsSchema extends TSchema
> {
	authorization?: Authorization;
	body?: ValidateFunction<BodySchema> | BodySchema;
	jsonBody?: boolean;
	searchParams?: ValidateFunction<SearchParamsSchema> | SearchParamsSchema;
	rateLimit?: keyof typeof rateLimitLevels;
	requiredRole?: 'admin';
}

export interface LoadHandlerOptions<Authorization extends TAuthorization> {
	authorization?: Authorization;
	requiredRole?: 'admin';
}

export function actionHandler<
	Event extends RequestEvent,
	Result,
	BodySchema extends TSchema,
	SearchParamsSchema extends TSchema,
	Authorization extends TAuthorization = true,
	HandlerEvent extends Event = Authorization extends true
		? Event & { locals: { user: IUser } }
		: Authorization extends 'apiKey'
			? Event & { locals: { apiKey: IApiKey } }
			: Event
>(
	fn: (event: HandlerEvent, body: Static<BodySchema>) => Result,
	options: ActionHandlerOptions<Authorization, BodySchema, SearchParamsSchema> = {}
) {
	const bodySchema =
		options.body && typeof options.body !== 'function' ? compileSchema(options.body) : options.body;
	return async (event: Event) => {
		if (options.rateLimit) {
			await rateLimit(options.rateLimit, event);
		}
		const { i18n, user } = event.locals;
		if (options.authorization !== false && !user) {
			throw new UnauthorizedError();
		}
		if (options.requiredRole) {
			checkUserAccountAccess(user, event.params.accountId!, options.requiredRole);
		}
		try {
			let data: unknown = Object.fromEntries(await event.request.formData());
			if (bodySchema) {
				data = validateSchema(bodySchema, data);
			}
			return await fn(event as HandlerEvent, data as Static<BodySchema>);
		} catch (err: any) {
			if (err?.status && err.status >= 300 && err.status < 400 && err?.location) {
				// redirect
				throw err;
			}
			if (err instanceof BaseError) {
				if (err instanceof ValidationError) {
					const statusCode = err.statusCode || 400;
					return fail(statusCode, {
						error: i18n('error.validation_error'),
						fields: err.details.reduce(
							(acc, item) => {
								if (item.instancePath) {
									acc[item.instancePath.slice(1).replace(/\//g, '.')] = item.message || '';
								}
								return acc;
							},
							{} as Record<string, string>
						),
						statusCode
					});
				}
			}
			console.error(err);
			const statusCode = err.statusCode || 400;
			return fail(
				statusCode,
				err && typeof err.toJSON === 'function'
					? err.toJSON()
					: { error: 'Server error', statusCode }
			);
		}
	};
}

export function loadHandler<
	Event extends RequestEvent,
	Result,
	Authorization extends TAuthorization = true,
	HandlerEvent extends Event = Authorization extends true
		? Event & { locals: { user: IUser } }
		: Authorization extends 'apiKey'
			? Event & { locals: { apiKey: IApiKey } }
			: Event
>(fn: (event: HandlerEvent) => Result, options: LoadHandlerOptions<Authorization> = {}) {
	return async (event: Event) => {
		const { user } = event.locals;
		if (options.authorization !== false && !user) {
			throw redirect(303, '/app/authentication');
		}
		if (options.requiredRole) {
			checkUserAccountAccess(user, event.params.accountId!, options.requiredRole);
		}
		return fn(event as HandlerEvent);
	};
}

export function requestHandler<
	Event extends RequestEvent,
	Result,
	BodySchema extends TSchema,
	SearchParamsSchema extends TSchema,
	Authorization extends TAuthorization = true,
	HandlerEvent extends Event = Authorization extends true
		? Event & { locals: { user: IUser } }
		: Authorization extends 'apiKey'
			? Event & { locals: { apiKey: IApiKey } }
			: Event
>(
	fn: (
		event: HandlerEvent,
		body: Static<BodySchema>,
		searchParams: Static<SearchParamsSchema>
	) => Result,
	options: ActionHandlerOptions<Authorization, BodySchema, SearchParamsSchema> = {}
) {
	const bodySchema =
		options.body && typeof options.body !== 'function' ? compileSchema(options.body) : options.body;
	const searchParamsSchema =
		options.searchParams && typeof options.searchParams !== 'function'
			? compileSchema(options.searchParams)
			: options.searchParams;
	return async (event: Event) => {
		if (options.rateLimit) {
			await rateLimit(options.rateLimit, event);
		}
		const { apiKey, user } = event.locals;
		if (options.authorization === 'apiKey') {
			if (!apiKey) {
				throw new UnauthorizedError();
			}
		} else if (options.authorization !== false && !user) {
			throw new UnauthorizedError();
		}
		if (options.requiredRole) {
			checkUserAccountAccess(user, event.params.accountId!, options.requiredRole);
		}
		let searchParams: Static<SearchParamsSchema> = Object.fromEntries(
			event.url.searchParams.entries()
		);
		if (searchParamsSchema) {
			searchParams = validateSchema(searchParamsSchema, searchParams);
		}
		let data: unknown = bodySchema ? await readBody(event, options.jsonBody) : void 0;
		if (bodySchema) {
			data = validateSchema(bodySchema, data);
		}
		const result = await fn(event as HandlerEvent, data as Static<BodySchema>, searchParams);
		if (result && result instanceof Response) {
			return result;
		}
		if (result === void 0) {
			return new Response(void 0, {
				status: 204
			});
		}
		return new Response(JSON.stringify(result), {
			headers: {
				'content-type': 'application/json'
			}
		});
	};
}

export async function readBody(event: RequestEvent, json: boolean = false) {
	const contentType = event.request.headers.get('content-type');
	if (json || contentType?.includes('application/json')) {
		return event.request.json();
	} else if (contentType?.includes('application/x-www-form-urlencoded')) {
		return Object.fromEntries(await event.request.formData());
	}
	return event.request.arrayBuffer();
}
