<script lang="ts">
	import { browser } from '$app/environment';
	import { decryptData } from '$lib/helpers';
	import { encryptionKeys, responseDataPromise } from '$lib/stores';

	export let encryptedData: string;
	export let encryptionKeyHash: string;

	let decrypted: any = null;

	$: $responseDataPromise = browser
		? decryptData(encryptedData, encryptionKeyHash, $encryptionKeys).then(
				(result) => {
					decrypted = result;
					return result;
				},
				() => {
					decrypted = null;
				}
			)
		: Promise.resolve(null);
</script>

<slot {decrypted} decryptedPromise={$responseDataPromise} />
