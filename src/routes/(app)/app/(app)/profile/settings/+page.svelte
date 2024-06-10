<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import EmailInput from '$lib/components/blocks/EmailInput.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import type { PageData } from './$types';
	import Alert from '$lib/components/Alert.svelte';

	export let data: PageData;

	let recovertPassphrase: string = '';
</script>

<Form action="?/save" class="flex flex-col gap-12" let:changed let:loading>
	<div class="max-w-lg flex flex-col gap-12">
		<TextInput
			block={{
				help: $_('label.profile_name'),
				label: $_('label.name'),
				name: 'name',
				required: true
			}}
			value={data.name}
		/>

		<EmailInput
			block={{
				help: $_('label.profile_email'),
				label: $_('label.email'),
				name: 'email',
				required: true
			}}
			value={data.email}
		/>

		<PasswordInput
			autocomplete="one-time-code"
			block={{
				help: $_('help.recovery_passphrase'),
				label: $_('label.recovery_passphrase'),
				name: 'recovertPassphrase'
			}}
			bind:value={recovertPassphrase}
		/>

		<TextInput
			block={{
				help: $_('help.recovery_passphrase_hint'),
				label: $_('label.recovery_passphrase_hint'),
				name: 'recovertPassphraseHint'
			}}
			disabled={!recovertPassphrase && !data.hasRecoveryPassphrase}
			value={data.recovertPassphraseHint}
		/>

		{#if data.hasRecoveryPassphrase}
			<Alert variant="success">
				{$_('text.recovery_passphrase_set')}

				<svelte:fragment slot="actions">
					<Form
						action="?/removeRecoveryPassphrase"
						confirmText={$_('text.confirm_remove_recovery_passphrase')}
					>
						<button type="submit" class="link">{$_('button.unset')}</button>
					</Form>
				</svelte:fragment>
			</Alert>
		{/if}
	</div>

	<StickyButtons disabled={!changed} {loading} />
</Form>
