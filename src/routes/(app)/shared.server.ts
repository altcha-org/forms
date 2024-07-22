import { formatBytes } from '$lib/format';
import { ForbiddenError } from '$lib/server/errors';
import { accountsService } from '$lib/server/services/accounts.service';
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
	if (form.account.suspended) {
		throw new ForbiddenError('Account suspended.');
	}
	if (form.account.plan?.featureFiles !== true) {
		throw new ForbiddenError('File upload not enabled for plan.');
	}
	const maxFileSize = form.account.plan.limitFileSize * 1024 * 1024;
	if (data.size > maxFileSize) {
		throw new ForbiddenError(`Max. allowed file size is ${formatBytes(maxFileSize)}.`);
	}
	if (form.account.plan.limitUploads && form.account.plan.limitUploads <= form.account.uploads) {
		throw new ForbiddenError('You have reached the upload limit for your current plan.');
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
	await accountsService.incrementUploads(form.accountId);
	if (
		form.account.plan.limitUploads &&
		form.account.plan.trialDays &&
		form.account.plan.limitUploads <= form.account.uploads
	) {
		// trial account
		await accountsService.suspendAccount(form.account.id, 'trial_expired');
		await accountsService.trackSuspendEvent(form.account, {
			suspended: 'trial_expired'
		});
	}
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
