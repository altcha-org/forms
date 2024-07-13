import { Type as t } from '@sinclair/typebox';
import { filesService } from '$lib/server/services/files.service';
import { requestHandler } from '$lib/server/handlers';
import { ForbiddenError } from '$lib/server/errors';
import type { RequestHandler } from './$types';

export const POST = requestHandler(
	async (event, body) => {
		const file = await filesService.findFile(event.params.fileId);
		if (!file || file.finalized) {
			throw new ForbiddenError();
		}
		await filesService.updateFile(file.id, {
			encryptedSize: file.encrypted ? body.encryptedSize : void 0,
			expiresAt: null,
			finalized: true
		});
	},
	{
		authorization: false,
		body: t.Object({
			encryptedSize: t.Optional(
				t.Integer({
					minimum: 0
				})
			)
		}),
		rateLimit: 'L3'
	}
) satisfies RequestHandler;
