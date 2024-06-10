import { Type as t } from '@sinclair/typebox';

export default t.Object({
	config: t.Record(t.String(), t.Any()),
	enabled: t.Boolean(),
	type: t.String()
});
