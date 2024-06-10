import { Type as t } from '@sinclair/typebox';
import formProcessorSchema from './formProcessor.schema';
import formStepSchema from './formStep.schema';

export default t.Object({
	badges: t.Optional(t.Array(t.String())),
	banner: t.Optional(t.String()),
	captchaAuto: t.Optional(t.Boolean()),
	captchaComplexity: t.Optional(t.String()),
	captchaInvisible: t.Optional(t.Boolean()),
	confetti: t.Optional(t.Boolean()),
	contextInfo: t.Optional(t.Boolean()),
	displayBlocks: t.Optional(t.Array(t.String())),
	footer: t.Optional(t.String()),
	hidePoweredBy: t.Optional(t.Boolean()),
	locale: t.Optional(t.String()),
	logo: t.Optional(t.String()),
	name: t.Optional(t.String()),
	password: t.Optional(t.String()),
	processors: t.Optional(t.Array(formProcessorSchema)),
	restricted: t.Optional(t.Boolean()),
	status: t.Optional(t.String()),
	steps: t.Optional(t.Array(formStepSchema)),
	success: t.Optional(t.String()),
	successRedirect: t.Optional(
		t.String({
			format: 'uri'
		})
	)
});
