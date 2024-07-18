<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
	import { debounce } from '$lib/helpers';
	import EmailInput from '$lib/components/blocks/EmailInput.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Form from '$lib/components/Form.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import OAuthLogin from '$lib/components/OAuthLogin.svelte';
	import FingerprintIcon from '$lib/components/icons/Fingerprint.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import CheckboxInput from '$lib/components/blocks/CheckboxInput.svelte';
	import ExternalIcon from '$lib/components/icons/External.svelte';
	import { getDeviceName, getTimeZone } from '$lib/helpers';
	import { device } from '$lib/stores';
	import { initPasskeyAuthentication, initPasskeyRegistration } from '../shared';
	import type { PageData } from './$types';
	import type {
		PublicKeyCredentialCreationOptionsJSON,
		PublicKeyCredentialDescriptorJSON
	} from '@simplewebauthn/types';

	export let data: PageData;

	const supportsWebAuthn = browser && browserSupportsWebAuthn();
	const _onVisibilityChange = debounce(() => {
		if (!document.hidden && navigator.onLine && supportsWebAuthn) {
			invalidateAll().then(() => initConditionalUi());
		}
	}, 20000);

	let authError: string | undefined = void 0;
	let loading: boolean = false;
	let conditionalUiCanceled: boolean = false;
	let registerModalOpen: boolean = false;
	let registerEmail: string | undefined = void 0;

	$: region = data.region;
	$: privacyPolicyUrl = data.privacyPolicyUrl;
	$: termsOfServiceUrl = data.termsOfServiceUrl;

	onMount(() => {
		if (supportsWebAuthn) {
			requestAnimationFrame(() => {
				initConditionalUi();
			});
		}
		// remove persistent store's data from memory
		$device = void 0;
	});

	function initConditionalUi() {
		if (data.webAuthnChallenge) {
			initPasskeyAuthentication($page.url.hostname, data.webAuthnChallenge).then((result) => {
				if (!conditionalUiCanceled) {
					onAuth(result);
				}
			});
		}
	}

	async function onAuth({ error, success }: Awaited<ReturnType<typeof initPasskeyAuthentication>>) {
		authError = error?.startsWith('error.') ? $_(error) : error;
		if (success) {
			goto('/app', {
				invalidateAll: true
			});
		} else {
			loading = false;
		}
	}

	function onSubmit(data: {
		result: {
			data: {
				challenge: string;
				email?: string;
				userId: string;
				requestRegistration?: boolean;
				authentication?: PublicKeyCredentialDescriptorJSON;
				registration?: PublicKeyCredentialCreationOptionsJSON;
			};
		};
	}) {
		conditionalUiCanceled = true;
		if (!loading) {
			loading = true;
		}
		if (data.result.data.requestRegistration) {
			registerModalOpen = true;
			registerEmail = data.result.data.email;
		} else if (data.result.data.registration) {
			initPasskeyRegistration(
				data.result.data.challenge,
				data.result.data.userId,
				data.result.data.registration
			).then(onAuth);
		} else if (data.result.data.authentication) {
			// @ts-expect-error ts error
			const { allowCredentials } = data.result.data.authentication;
			initPasskeyAuthentication(
				$page.url.hostname,
				data.result.data.challenge,
				allowCredentials
			).then(onAuth);
		}
	}
</script>

<svelte:document on:visibilitychange={() => _onVisibilityChange()} />

<div class="bg-base-100 p-5 md:rounded-xl md:shadow-lg w-full md:max-w-sm">
	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-6 mb-3">
			<div class="text-xl font-light">{$_('title.authentication')}</div>
		</div>
		{#if !data.webAuthnDisabled}
			<Form
				action="?/passkey"
				data={{
					deviceName: getDeviceName(),
					deviceTimezone: getTimeZone()
				}}
				discardUnsaved
				successToast={false}
				on:submit={(ev) => onSubmit(ev.detail)}
				bind:loading
				let:error
			>
				<div class="flex flex-col gap-6">
					{#if browser && !supportsWebAuthn}
						<Alert>
							{$_('text.passkey_not_supported')}
						</Alert>
					{/if}

					<EmailInput
						autocomplete="username webauthn"
						error={error?.fields?.email || authError}
						block={{
							label: $_('label.email'),
							name: 'email',
							readonly: loading,
							required: true,
							type: 'EmailInput'
						}}
						disabled={!supportsWebAuthn}
					/>

					<div>
						<button
							type="submit"
							class="btn btn-primary w-full"
							disabled={!supportsWebAuthn || loading}
						>
							{#if loading}
								<span class="loading loading-spinner"></span>
							{:else}
								<FingerprintIcon class="w-6 h-6" />
								<span class="grow pr-9">{$_('button.authenticate')}</span>
							{/if}
						</button>
					</div>

					<div class="prose text-sm">
						<MarkdownRenderer value={$_('text.passkey_info')} />
					</div>

					{#if supportsWebAuthn}
						<div class="flex justify-center gap-4">
							<a href="/app/recover_access" class="text-sm link">{$_('button.recover_access')}</a>
						</div>
					{/if}
				</div>
			</Form>
		{/if}

		{#if data.oauthProviders.length}
			{#if !data.webAuthnDisabled}
				<div class="divider text-base-content/50 my-6">{$_('text.or')}</div>
			{/if}

			<OAuthLogin providers={data.oauthProviders} />
		{/if}
	</div>
</div>

<Modal
	action="?/register"
	buttonLabel={$_('button.register')}
	title={$_('title.register')}
	subtitle={region ? $_('region.' + region) : void 0}
	data={{
		email: registerEmail,
		tz: getTimeZone()
	}}
	successToast={false}
	bind:open={registerModalOpen}
	on:submit={(ev) => onSubmit(ev.detail)}
>
	<div class="flex flex-col gap-6">
		<MarkdownRenderer
			value={$_('text.user_not_found_info', { values: { email: registerEmail } })}
		/>

		<div class="flex gap-3">
			<span class="inline-flex gap-1">
				<a href={termsOfServiceUrl} target="_blank" class="link">{$_('label.terms_of_service')}</a>
				<ExternalIcon class="w-3 h-3" />
			</span>
			<span class="inline-flex gap-1">
				<a href={privacyPolicyUrl} target="_blank" class="link">{$_('label.privacy_policy')}</a>
				<ExternalIcon class="w-3 h-3" />
			</span>
		</div>

		<CheckboxInput
			block={{
				label: $_('text.accept_terms'),
				name: 'terms',
				required: true
			}}
		/>

		<div class="flex items-start gap-3 border-y border-base-300 py-6">
			<div>
				<FingerprintIcon class="w-6 h-6 mt-0.5" />
			</div>

			<div>
				<MarkdownRenderer value={$_('text.user_not_found_passkeys')} />
			</div>
		</div>

		{#if data.availableRegions.length > 1}
			<div class="flex flex-col gap-1 items-center justify-center text-sm">
				<div class="text-center">
					<span class="opacity-60">{$_('text.select_region_to_register')}</span>
				</div>

				<div class="flex gap-3 items-center justify-center">
					{#each data.availableRegions as { region, url }}
						<a href={url} class="link">
							<span>{$_('region.' + region)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</Modal>
