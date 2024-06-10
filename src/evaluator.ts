export function evalExpression(expression: string, context: Record<string, any>) {
	const tokens = expression.split(/\s+/);
	const getValue = (variable: string) => {
		const parts = variable.split('.');
		let value = context;
		for (const part of parts) {
			if (!value || typeof value !== 'object') return undefined;
			value = value[part];
		}
		return value;
	};
	const stack = [];
	const operators = {
		'&&': (a: any, b: any) => a && b,
		'||': (a: any, b: any) => a || b,
		'!': (a: any) => !a
	};
	for (const token of tokens) {
		if (token in operators) {
			const operand2: any = stack.pop();
			const operand1: any = stack.pop();
			if (operand1 === undefined || operand2 === undefined) {
				throw new Error('Invalid expression');
			}
			const result = operators[token as keyof typeof operators](operand1, operand2);
			stack.push(result);
		} else if (token.startsWith('$.')) {
			const value = getValue(token);
			if (value === undefined) {
				throw new Error(`Variable ${token} not found`);
			}
			stack.push(value);
		} else {
			throw new Error(`Invalid token: ${token}`);
		}
	}

	if (stack.length !== 1) {
		throw new Error('Invalid expression');
	}

	return stack[0];
}
