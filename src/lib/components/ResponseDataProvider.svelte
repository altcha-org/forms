<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DecryptedDataProvider from '$lib/components/DecryptedDataProvider.svelte';
	import { stringifyBlockValue } from '$lib/helpers';
	import type { IResponse } from '$lib/types';

	export let displayBlocks: string[] = [];
	export let response: Pick<
		IResponse,
		'data' | 'dataEncrypted' | 'encrypted' | 'encryptionKeyHash'
	>;
</script>

{#if response.encrypted}
	{#if response.dataEncrypted && response.encryptionKeyHash}
		<DecryptedDataProvider
			encryptedData={response.dataEncrypted}
			encryptionKeyHash={response.encryptionKeyHash}
			let:decrypted
		>
			<slot
				headline={stringifyBlockValue(decrypted?.[displayBlocks[0]])}
				responseData={decrypted}
				{displayBlocks}
			/>
		</DecryptedDataProvider>
	{:else}
		<div>{$_('text.unable_to_decrypt_data')}</div>
	{/if}
{:else}
	<slot
		headline={stringifyBlockValue(response.data?.[displayBlocks[0]])}
		responseData={response.data}
		{displayBlocks}
	/>
{/if}
