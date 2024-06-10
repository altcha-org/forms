import type { ErrorObject } from 'ajv';

export class BaseError extends Error {
	statusCode: number = 500;

	constructor(public message: string = 'Error') {
		super(message);
	}

	toJSON() {
		return {
			error: this.message,
			statusCode: this.statusCode
		};
	}
}

export class UnauthorizedError extends BaseError {
	constructor(public message: string = 'Unauthorized') {
		super(message);
		this.statusCode = 401;
	}
}

export class BadRequestError extends BaseError {
	constructor(public message: string = 'Bad request') {
		super(message);
		this.statusCode = 400;
	}
}

export class ForbiddenError extends BaseError {
	constructor(public message: string = 'Forbidden') {
		super(message);
		this.statusCode = 403;
	}
}

export class NotFoundError extends BaseError {
	constructor(public message: string = 'Not found') {
		super(message);
		this.statusCode = 404;
	}
}

export class RateLimitError extends BaseError {
	constructor(
		public info: { limit: number; remaining: number; reset: number },
		public message: string = 'Too many requests'
	) {
		super(message);
		this.statusCode = 429;
	}
}

export class ValidationError extends BaseError {
	constructor(
		public message: string = 'Validation error',
		public details: Partial<ErrorObject>[] = [],
		public location?: string
	) {
		super(message);
		this.statusCode = 400;
	}

	toString() {
		return `${this.message}\n${this.details.map((detail) => `  ${detail?.message || detail}`)}`;
	}

	toJSON() {
		return {
			error: this.message,
			details: this.details,
			location: this.location,
			statusCode: this.statusCode
		};
	}
}

export class FieldValidationError extends ValidationError {
	constructor(fieldName: string, message: string) {
		super(void 0, [
			{
				instancePath: '/' + fieldName,
				message
			}
		]);
	}
}
