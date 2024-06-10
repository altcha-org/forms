import { stat } from 'node:fs/promises';
import { filesService, type IFile } from '$lib/server/services/files.service';
import { requestHandler } from '$lib/server/handlers';
import { checkUserAccountAccess } from '$lib/server/helpers';
import { BadRequestError, ForbiddenError, NotFoundError } from '$lib/server/errors';
import type { RequestHandler, RequestEvent } from './$types';

export const HEAD = requestHandler(
	async (event) => {
		const file = await filesService.findFile(event.params.fileId);
		if (!file) {
			throw new ForbiddenError();
		}
		checkAccess(event, file);
		return new Response('', {
			headers: {
				'Cache-Control': `${file.public ? 'public' : 'private'}, max-age=14400, immutable`,
				'Content-Disposition': `inline; filename="${encodeURIComponent(file.name)}"`,
				'Content-Type': file.type,
				'Content-Length': String(file.encrypted ? file.encryptedSize : file.size),
				'X-Encrypted': file.encrypted ? 'true' : 'false',
				'X-Encryption-Key': file.encryptionKeyHash ? file.encryptionKeyHash : ''
			}
		});
	},
	{
		authorization: false,
		rateLimit: 'L1'
	}
) satisfies RequestHandler;

export const GET = requestHandler(
	async (event) => {
		const download = event.url.searchParams.get('download') === '1';
		const file = await filesService.findFile(event.params.fileId);
		if (!file) {
			throw new ForbiddenError();
		}
		checkAccess(event, file);
		try {
			const stream = await filesService.storage.get(filesService.storage.getFilePath(file));
			return new Response(stream, {
				headers: {
					'Cache-Control': `${file.public ? 'public' : 'private'}, max-age=14400, immutable`,
					'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.name)}"`,
					'Content-Type': file.type,
					'Content-Length': String(file.encrypted ? file.encryptedSize : file.size),
					'X-Encrypted': file.encrypted ? 'true' : 'false',
					'X-Encryption-Key': file.encryptionKeyHash ? file.encryptionKeyHash : ''
				}
			});
		} catch (err) {
			// TODO: log file error
			throw new NotFoundError();
		}
	},
	{
		authorization: false,
		rateLimit: 'L1'
	}
) satisfies RequestHandler;

export const PUT = requestHandler(
	async (event) => {
		const uploadToken = new URL(event.request.url).searchParams.get('uploadToken');
		const file = await filesService.findFile(event.params.fileId);
		if (!file || !file.expiresAt) {
			throw new ForbiddenError();
		}
		const ok = await filesService.verifyUploadToken(file, uploadToken);
		if (!ok) {
			throw new ForbiddenError();
		}
		if (!event.request.body) {
			throw new BadRequestError();
		}
		const maxFileSize = file.account?.plan ? file.account.plan.limitFileSize * 1024 * 1024 : null;
		const contentLength = parseInt(event.request.headers.get('content-length') || '0', 10);
		if (maxFileSize !== null && contentLength && contentLength > maxFileSize) {
			throw new ForbiddenError();
		}
		const tmpFilePath = filesService.tmp.getRandomPath();
		try {
			await filesService.tmp.put(tmpFilePath, event.request.body);
			const fileSize = (await stat(tmpFilePath))?.size;
			if (maxFileSize !== null && fileSize > maxFileSize) {
				throw new ForbiddenError();
			}
			const body = await filesService.tmp.get(tmpFilePath);
			await filesService.storage.put(
				filesService.storage.getFilePath(file),
				body,
				event.request.headers.get('content-type') || 'application/octet-stream',
				fileSize
			);
		} finally {
			// remove the tmp file in case upload error
			await filesService.tmp.delete(tmpFilePath);
		}
	},
	{
		authorization: false,
		rateLimit: 'L3'
	}
) satisfies RequestHandler;

function checkAccess(event: RequestEvent, file: IFile) {
	if (!file.public) {
		if (event.locals.apiKey) {
			if (event.locals.apiKey.account.id !== file.accountId) {
				throw new ForbiddenError();
			}
		} else {
			checkUserAccountAccess(event.locals.user, file.accountId);
		}
	}
}
