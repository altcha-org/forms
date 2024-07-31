<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onDestroy, onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import Altcha from '$lib/components/Altcha.svelte';
	import AltchaInvisible from '$lib/components/AltchaInvisible.svelte';
	import Form from '$lib/components/Form.svelte';
	import FormFooter from '$lib/components/FormFooter.svelte';
	import FormHeader from '$lib/components/FormHeader.svelte';
	import FormRenderer from '$lib/components/FormRenderer.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import { shortenFormId } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	const referrer = getReferrer();

	let formPassword: string = '';
	let loading: boolean = false;
	let securityForm: Form | null = null;
	let autoTimeout: ReturnType<typeof setTimeout>;

	setContext('limitFileSize', data.limitFileSize);

	$: challengeurl = `/form/${shortenFormId(data.form.id)}/altcha`;
	$: passwordProtected = !!data.form.password;
	$: passwordOk = data.passwordOk;

	onDestroy(() => {
		if (autoTimeout) {
			clearTimeout(autoTimeout);
		}
	});

	onMount(() => {
		const submitted = document.body.getAttribute('data-form-submitted') === data.form.id;
		if (
			browser &&
			submitted &&
			referrer &&
			new URL(referrer).origin !== location.origin &&
			!data.formData
		) {
			// This would trigger when the user clicks the back button -> redirect to referrer
			location.href = referrer;
		}

		if (data.formData?.altcha && securityForm) {
			autoTimeout = setTimeout(() => {
				securityForm?.requestSubmit();
			}, 1500);
		}
	});

	function getReferrer() {
		if (browser) {
			const url = new URL(location.href);
			const ref = url.searchParams.get('referrer') || url.searchParams.get('ref');
			return ref || document.referrer;
		}
		return '';
	}
</script>

<div class="min-h-screen">
	<FormHeader form={data.form} />

	{#if passwordProtected && !passwordOk}
		<div class="py-12">
			<div class="bg-base-200 max-w-sm mx-auto p-6 rounded-lg">
				<Form action="?/submitPassword" autocomplete="off" let:error>
					<div class="flex flex-col gap-6">
						<div class="text-lg font-bold">
							{$_('title.password_protected')}
						</div>

						<div>
							<p>{$_('text.form_password_protected')}</p>
						</div>

						<PasswordInput
							autocomplete="none"
							block={{
								label: $_('label.password'),
								name: 'form_password',
								type: 'PasswordInput'
							}}
							error={error?.fields?.form_password}
							bind:value={formPassword}
						/>

						<div>
							<button type="submit" class="btn btn-primary" disabled={!formPassword}
								>{$_('button.next')}</button
							>
						</div>
					</div>
				</Form>
			</div>
		</div>
	{:else if data.formData}
		<div class="max-w-lg mx-auto py-12">
			<Form
				bind:this={securityForm}
				action={`/form/${shortenFormId(data.form.id)}/submit`}
				data={{
					__referrer: referrer,
					...data.formData
				}}
				on:submit={() => {
					document.body.setAttribute('data-form-submitted', data.form.id);
				}}
				bind:loading
			>
				<div class="flex flex-col gap-6">
					{#if data.formData?.altcha}
						<div class="flex flex-col gap-3">
							<p class="text-2xl">{$_('title.security_check')}</p>

							<p>{$_('text.security_check_auto')}</p>
						</div>

						<div>
							<span class="loading loading-spinner loading-sm"></span>
						</div>
					{:else}
						<div class="flex flex-col gap-3">
							<p class="text-2xl">{$_('title.security_check')}</p>

							<p>{$_('text.security_check')}</p>
						</div>

						<div>
							<div class="bg-base-100 w-full max-w-[260px]">
								{#if data.form.captchaInvisible}
									<AltchaInvisible bind:loading {challengeurl} />
								{:else}
									<Altcha
										auto={data.form.captchaAuto}
										floating={data.form.captchaFloating}
										hideBranding={data.form.hidePoweredBy}
										{challengeurl}
									/>
								{/if}
							</div>
						</div>

						<div>
							<button type="submit" class="btn btn-neutral btn-wide" disabled={loading}>
								{#if loading}
									<span class="loading loading-spinner loading-sm"></span>
								{/if}
								<span class="grow">{$_('button.confirm')}</span>
								<CheckIcon class="w-5 h-5" />
							</button>
						</div>
					{/if}
				</div>
			</Form>
		</div>
	{:else}
		<div class="xl:px-5 pb-12">
			<FormRenderer analytics={data.analytics} encrypted={data.encrypted} form={data.form} />
		</div>
	{/if}
</div>

<FormFooter form={data.form} hidePoweredBy={data.form.hidePoweredBy && data.licenseValid} />
