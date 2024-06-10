import { Type as t } from '@sinclair/typebox';

export default t.Object({
	limit: t.Integer({
		default: 30,
		maximum: 100,
		minimum: 1
	}),
	offset: t.Integer({
		default: 0,
		minimum: 0
	}),
	orderDir: t.Union([t.Literal('asc'), t.Literal('desc')], {
		default: 'asc'
	}),
	orderBy: t.String({
		default: 'id'
	})
});
