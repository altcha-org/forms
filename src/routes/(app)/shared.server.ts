import { formatBytes } from '$lib/format';
import { ForbiddenError } from '$lib/server/errors';
import { encryptionKeysService } from '$lib/server/services/encryptionKeys.service';
import { filesService } from '$lib/server/services/files.service';
import type { IForm } from '$lib/types';

interface IRequestFileUploadData {
	name: string;
	public?: boolean;
	size: number;
	type: string;
}

export async function requestFileUpload(form: IForm, data: IRequestFileUploadData) {
	if (form.account.plan?.featureFiles !== true) {
		throw new ForbiddenError('File upload not enabled for plan.');
	}
	const maxFileSize = form.account.plan.limitFileSize * 1024 * 1024;
	if (data.size > maxFileSize) {
		throw new ForbiddenError(`Max. allowed file size is ${formatBytes(maxFileSize)}.`);
	}
	const encyptionKey = await encryptionKeysService.findEncryptionKeyForAccount(form.account.id);
	const encrypted = !data.public && form.account.encryptionEnabled && !!encyptionKey;
	const file = await filesService.createFile({
		accountId: form.accountId,
		encrypted,
		encryptionKeyHash: encyptionKey?.hash || null,
		formId: form.id,
		persistent: !!data.public,
		responseId: null,
		name: data.name,
		public: data.public === void 0 ? false : data.public,
		size: data.size,
		type: data.type
	});
	let uploadUrl = await filesService.getUploadUrl(file);
	if (uploadUrl.startsWith('/')) {
		const url = new URL(uploadUrl, 'http://localhost');
		url.searchParams.set('uploadToken', filesService.generateUploadToken(file));
		uploadUrl = url.pathname + url.search;
	}
	return {
		encrypted,
		encryptionPublicKey: encyptionKey?.publicKey,
		expires: file.expiresAt,
		fileId: file.id,
		uploadUrl
	};
}
