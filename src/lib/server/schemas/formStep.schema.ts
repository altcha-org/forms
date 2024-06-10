import { Type as t } from '@sinclair/typebox';
import formBlockSchema from '$lib/server/schemas/formBlock.schema';

export default t.Object({
	blocks: t.Array(formBlockSchema),
	text: t.Optional(t.String()),
	title: t.Optional(t.String())
});
