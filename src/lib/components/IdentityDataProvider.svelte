<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DecryptedDataProvider from '$lib/components/DecryptedDataProvider.svelte';
	import type { IIdentity } from '$lib/types';

	export let identity: Pick<
		IIdentity,
		'encrypted' | 'encryptionKeyHash' | 'metadata' | 'metadataEncrypted'
	>;

  function parseAndSortMetadata(metadata: string | Record<string, string> | null) {
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        // noop
        metadata = {};
      }
    }
    return Object.entries(metadata || {}).sort(([a], [b]) => a.localeCompare(b));
  }
</script>

{#if identity.encrypted}
	{#if identity.metadataEncrypted && identity.encryptionKeyHash}
		<DecryptedDataProvider
			encryptedData={identity.metadataEncrypted}
			encryptionKeyHash={identity.encryptionKeyHash}
			let:decrypted
		>
			<slot
      identityMetadata={parseAndSortMetadata(decrypted)}
			/>
		</DecryptedDataProvider>
	{:else}
		<div>{$_('text.unable_to_decrypt_data')}</div>
	{/if}
{:else}
	<slot
		identityMetadata={parseAndSortMetadata(identity.metadata)}
	/>
{/if}
