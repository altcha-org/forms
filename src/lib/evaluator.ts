export function evalExpression(expression: string, input: Record<string, unknown>): boolean | null {
	if (expression.includes('&&')) {
		return evalLogicalOperator(expression.split('&&'), input, true);
	}
	if (expression.includes('||')) {
		return evalLogicalOperator(expression.split('||'), input, false);
	}
	const match = expression
		.trim()
		.match(/^(!)?(\$\.\w+)\s{0,}([^\w\s]{1,}|includes|startsWith|endsWith)?\s{0,}(.*)?$/);
	if (!match) {
		return null;
	}
	let result: boolean = false;
	if (match[3]) {
		result = evalComparator(match[3], evalVariable(match[2], input), match[4]);
	} else {
		result = !!evalVariable(match[2], input);
	}
	return match[1] === '!' ? !result : result;
}

function evalLogicalOperator(expressions: string[], input: Record<string, unknown>, and: boolean) {
	return expressions.reduce(
		(acc, sub, i) => {
			if (acc !== null) {
				const result = evalExpression(sub, input);
				if (result === null) {
					return null;
				}
				return and && i > 0 ? acc && result : acc || result;
			}
			return acc;
		},
		false as boolean | null
	);
}

function evalVariable(name: string, input: Record<string, unknown>) {
	return input[name.slice(2)];
}

function evalComparator(op: string, left: unknown, right: unknown): boolean {
	switch (op) {
		case '===':
		case '==':
			return left == right;
		case '!=':
			return left != right;
		case '>':
			return String(left) > String(right);
		case '>=':
			return String(left) >= String(right);
		case '<':
			return String(left) < String(right);
		case '<=':
			return String(left) <= String(right);
		case 'includes':
			return String(left).includes(String(right));
		case 'startsWith':
			return String(left).startsWith(String(right));
		case 'endsWith':
			return String(left).endsWith(String(right));
		default:
			return !!left;
	}
}
