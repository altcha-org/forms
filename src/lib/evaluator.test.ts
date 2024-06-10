import { describe, expect, it } from 'vitest';
import { evalExpression } from '$lib/evaluator';

describe('Evaluator', () => {
	const input = {
		x: 2,
		z: 'hello world'
	};

	describe('invalid expressions', () => {
		const expressions = ['', 'abc', 'abc == 123', '==', '[]', '{}', 'true', 'false'];

		for (const expr of expressions) {
			it('should return null for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(null);
			});
		}
	});

	describe('truthy expressions', () => {
		const expressions = [
			'$.x === 2',
			'$.x == 2',
			'$.x != 1',
			'$.x > 1',
			'$.x >= 2',
			'$.x < 3',
			'$.x <= 2',
			'$.x',
			'!$.y',
			'$.x==2',
			'$.x>1',
			'$.y!=1',
			'$.z includes hello world',
			'$.z startsWith hello',
			'$.z endsWith world'
		];

		for (const expr of expressions) {
			it('should return true for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(true);
			});
		}
	});

	describe('falsy expressions', () => {
		const expressions = [
			'$.x === 1',
			'$.x == 1',
			'$.x != 2',
			'$.x > 2',
			'$.x >= 3',
			'$.x < 1',
			'$.x <= 1',
			'!$.x',
			'$.z includes test',
			'$.z startsWith test',
			'$.z endsWith test'
		];

		for (const expr of expressions) {
			it('should return true for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(false);
			});
		}
	});

	describe('truthy expressions with &&', () => {
		const expressions = ['$.x == 2 && $.x != 1', '$.x == 2 && $.x != 1 && $.x > 0'];

		for (const expr of expressions) {
			it('should return true for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(true);
			});
		}
	});

	describe('false expressions with &&', () => {
		const expressions = ['$.x == 2 && $.x == 1', '$.x == 2 && $.x != 1 && $.x > 3'];

		for (const expr of expressions) {
			it('should return true for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(false);
			});
		}
	});

	describe('truthy expressions with ||', () => {
		const expressions = ['$.x == 0 || $.x != 1', '$.x == 0 || $.x == 1 || $.x > 0'];

		for (const expr of expressions) {
			it('should return true for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(true);
			});
		}
	});

	describe('false expressions with ||', () => {
		const expressions = ['$.x == 0 || $.x == 1', '$.x == 0 || $.x == 1 || $.x == 3'];

		for (const expr of expressions) {
			it('should return true for ' + expr, () => {
				expect(evalExpression(expr, input)).toEqual(false);
			});
		}
	});
});
