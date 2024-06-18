import { Type as t } from '@sinclair/typebox';
import { actionHandler } from '$lib/server/handlers';
import { IdentitiesService, identitiesService } from '$lib/server/services/identities.service';
import { accountsService } from '$lib/server/services/accounts.service';
import { identityMiddleware } from '../../../shared';
import type { Actions } from './$types';

export const actions = {
	updateMetadata: actionHandler(
		async (event, data) => {
      const { account, identity } = await identityMiddleware(event);
      let metadata = JSON.parse(data.metadata);
      if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
        metadata = {};
      }
      const updateData: Parameters<IdentitiesService['updateIdentity']>[1] = {}; 
      if (data.removeKey) {
        delete metadata[data.removeKey];
      }
      if (data.key) {
        metadata[data.key] = data.value || '';
      }
			const encrypted = account.encryptionEnabled
				? await accountsService.encryptData(account.id, JSON.stringify(metadata))
				: null;
      console.log('>>', {
        metadata,
        encrypted,
      })
      if (encrypted) {
        updateData.encrypted = true;
        updateData.encryptionKeyHash = encrypted.encryptionKeyHash;
        updateData.metadataEncrypted = encrypted.dataEncrypted;
      } else {
        updateData.encrypted = false;
        updateData.metadata = metadata;
      }
      await identitiesService.updateIdentity(identity.id, updateData);
		},
		{
			body: t.Object({
        metadata: t.String(),
        removeKey: t.Optional(t.String()),
        key: t.Optional(t.String({
          minLength: 1,
          maxLength: 100,
        })),
        value: t.Optional(t.String({
          maxLength: 500,
        })),
			})
		}
	),
} satisfies Actions;
