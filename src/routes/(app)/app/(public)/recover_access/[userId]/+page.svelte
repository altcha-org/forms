<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Form from '$lib/components/Form.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { formatDuration } from '$lib/format';
	import { initPasskeyRegistration } from '../../shared';
	import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
	import type { PageData } from './$types';

	export let data: PageData;

	let timeLoaded = Date.now();
	let timeLeft: number = data.timeLeft;
	let timeLeftFormatted: string = '';
	let timeLeftFormattedInterval: ReturnType<typeof setInterval> | null = null;
	let recoveryPassphrase: string = '';

	$: enabled = timeLeft === 0;
	$: recoveryToken = browser ? location.hash.match(/\?token=(.*)/)?.[1] : null;

	onDestroy(() => {
		if (timeLeftFormattedInterval) {
			clearInterval(timeLeftFormattedInterval);
			timeLeftFormattedInterval = null;
		}
	});

	onMount(() => {
		if (data.timeLeft) {
			timeLeftFormattedInterval = setInterval(timeLeftFormattedTick, 1000);
		}
		timeLeftFormattedTick();
	});

	function onSubmit(data: {
		result: {
			data: {
				challenge: string;
				userId: string;
				registration?: PublicKeyCredentialCreationOptionsJSON;
			};
		};
	}) {
		if (data.result.data.registration) {
			initPasskeyRegistration(
				data.result.data.challenge,
				data.result.data.userId,
				data.result.data.registration
			).then(({ success }) => {
				if (success) {
					goto('/app', {
						invalidateAll: true
					});
				}
			});
		}
	}

	function timeLeftFormattedTick() {
		timeLeft = Math.max(0, data.timeLeft - (Date.now() - timeLoaded));
		timeLeftFormatted = formatDuration(timeLeft);
	}
</script>

<div class="bg-base-100 p-5 md:rounded-xl md:shadow-lg w-full lg:max-w-sm">
	<Form
		action="?/confirmRecovery"
		data={{
			recoveryToken
		}}
		discardUnsaved
		successToast={false}
		invalidateOnSubmit={false}
		on:submit={(ev) => onSubmit(ev.detail)}
		let:error
	>
		<div class="flex flex-col gap-6">
			<div class="text-xl font-light">{$_('title.recover_access')}</div>

			{#if !data.validLink}
				<div class="flex flex-col items-center gap-3 bg-base-200 p-5 rounded-md">
					<div>{$_('text.wrong_link')}</div>
				</div>
			{:else}
				<div class="prose text-sm">
					<MarkdownRenderer value={$_('text.recover_access_instructions')} />
				</div>

				<div class="bg-base-200 p-3 rounded-md text-center">
					<span class="font-mono text-lg">{timeLeftFormatted}</span>
				</div>

				{#if enabled && data.passphraseRequired}
					<PasswordInput
						autocomplete="one-time-code"
						block={{
							label: $_('label.recovery_passphrase'),
							name: 'recoveryPassphrase',
							required: true,
							type: 'PasswordInput'
						}}
						error={error?.fields?.recoveryPassphrase}
						bind:value={recoveryPassphrase}
					/>

					{#if data.passphraseHint}
						<Alert variant="primary">
							{$_('label.hint')}: {data.passphraseHint}
						</Alert>
					{/if}
				{/if}

				<div>
					<button type="submit" class="btn btn-primary w-full" disabled={!enabled}
						>{$_('button.confirm_recovery')}</button
					>
				</div>

				<Form
					action="?/cancelRecovery"
					data={{
						recoveryToken
					}}
					discardUnsaved
					successToast={false}
					invalidateOnSubmit={false}
				>
					<div class="text-center">
						<button type="submit" class="link link-error">{$_('button.cancel_request')}</button>
					</div>
				</Form>
			{/if}
		</div>
	</Form>
</div>
