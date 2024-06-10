import { ValidationError } from './errors.js';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { Options, ValidateFunction } from 'ajv';
import type { TSchema, Static } from '@sinclair/typebox';

export type { ValidateFunction };

export let ajv = new Ajv({
	coerceTypes: true,
	useDefaults: true,
	removeAdditional: 'all'
});

addFormats(ajv);

export function setAjv(useAjv: Ajv | Options) {
	if ('compile' in useAjv) {
		ajv = useAjv as Ajv;
	} else {
		ajv = new Ajv(useAjv as Options);
	}
}

export function compileSchema<Schema extends TSchema>(schema: Schema): ValidateFunction<Schema> {
	return ajv.compile(schema);
}

export function validateSchema<Schema extends TSchema>(
	check: ValidateFunction<Schema>,
	data: unknown,
	location?: string
): Static<Schema> {
	if (!check(data)) {
		throw new ValidationError('Validation error', check.errors || [], location);
	}
	return data;
}
