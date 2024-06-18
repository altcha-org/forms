import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { responsesService } from '$lib/server/services/responses.service';
import { filesService } from '$lib/server/services/files.service';
import { formsService } from '$lib/server/services/forms.service';
import { clone } from '$lib/helpers';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(async ({ locals, parent, url }) => {
  const { identity } = await parent();
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const limit = 100;
  const responses = await responsesService.listResponsesForIdentity({
    identityId: identity.id,
    limit,
    offset,
  });
  return {
		forms: await formsService.listFormsForUser(identity.accountId, locals.user.id),
    limit,
    offset,
    responses,
  };
}) satisfies PageServerLoad;
