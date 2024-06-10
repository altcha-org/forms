import { Type as t } from '@sinclair/typebox';

export default t.Object({
	default: t.Optional(t.String()),
	help: t.Optional(t.String()),
	hidden: t.Optional(t.Boolean()),
	if: t.Optional(t.String()),
	label: t.Optional(t.String()),
	name: t.String(),
	options: t.Record(t.String(), t.String()),
	placeholder: t.Optional(t.String()),
	readonly: t.Optional(t.Boolean()),
	required: t.Optional(t.Boolean()),
	size: t.Optional(t.Union([t.Literal('xs'), t.Literal('sm'), t.Literal('md'), t.Literal('full')])),
	type: t.String()
});
