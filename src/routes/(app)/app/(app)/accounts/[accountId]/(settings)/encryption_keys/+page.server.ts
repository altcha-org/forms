import { rsa, helpers } from '@altcha/crypto';
import { Type as t } from '@sinclair/typebox';
import { actionHandler, loadHandler } from '$lib/server/handlers';
import { encryptionKeysService } from '$lib/server/services/encryptionKeys.service';
import { checkUserAccountAccess } from '$lib/server/helpers';
import { FieldValidationError, ForbiddenError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load = loadHandler(
	async (event) => {
		const { account } = await event.parent();
		const limitEncryptionKeys = account?.plan?.limitEncryptionKeys || 0;
		const encryptionKeys = await encryptionKeysService.listEncryptionKeysForAccount(
			event.params.accountId
		);
		return {
			encryptionKeys,
			canAddEncryptionKey:
				encryptionKeys.filter(({ deleted }) => !deleted).length < limitEncryptionKeys
		};
	},
	{
		requiredRole: 'admin'
	}
) satisfies PageServerLoad;

export const actions = {
	createEncryptionKey: actionHandler(
		async (event, data) => {
			checkUserAccountAccess(event.locals.user!, event.params.accountId, 'admin');
			if (!isValidPublicKey(data.publicKey)) {
				throw new FieldValidationError('publicKey', 'Invalid public key format.');
			}
			const limitEncryptionKeys = event.locals.account?.plan?.limitEncryptionKeys || 0;
			const activeEncryptionKeys = await encryptionKeysService.countActiveEncryptionKeysForAccount(
				event.params.accountId
			);
			if (activeEncryptionKeys > limitEncryptionKeys) {
				throw new ForbiddenError();
			}
			const hash = await rsa.getPublicKeyId(helpers.convertPemToUint8Array(data.publicKey));
			await encryptionKeysService.createEncryptionKey({
				accountId: event.params.accountId,
				hash,
				publicKey: data.publicKey
			});
		},
		{
			body: t.Object({
				publicKey: t.String()
			}),
			requiredRole: 'admin'
		}
	),

	deleteEncryptionKey: actionHandler(
		async (event, data) => {
			checkUserAccountAccess(event.locals.user!, event.params.accountId, 'admin');
			await encryptionKeysService.deleteEncryptionKey(data.encryptionKeyId);
		},
		{
			body: t.Object({
				encryptionKeyId: t.String()
			}),
			requiredRole: 'admin'
		}
	)
} satisfies Actions;

function isValidPublicKey(publicKey: string) {
	return (
		publicKey.startsWith('-----BEGIN PUBLIC KEY-----') &&
		publicKey.endsWith('-----END PUBLIC KEY-----')
	);
}
