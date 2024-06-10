<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import { form } from '$lib/stores';
	import { clone } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	let passwordEnabled: boolean = !!data.form.password;

	$: encryptionKeyOk =
		!$form.encryptionKeyHash ||
		!!data.encryptionKeys.find(({ hash }) => hash === $form.encryptionKeyHash);

	function onReset() {
		if (confirm($_('text.confirm_unsaved_changes'))) {
			$form = clone(data.form);
			passwordEnabled = !!$form.password;
		}
	}
</script>

<Form action="?/updateSecurity" on:reset={() => onReset()} let:changed let:loading>
	<div class="flex flex-col gap-12">
		<div>
			<ToggleInput
				block={{
					label: $_('label.collect_context_info'),
					help: $_('help.collect_context_info'),
					name: 'contextInfo'
				}}
				bind:value={$form.contextInfo}
			/>
		</div>

		<div class="flex flex-col gap-3">
			<div class="text-lg opacity-60">{$_('title.password_protection')}</div>

			<div>
				<ToggleInput
					block={{
						label: $_('label.enable_password_protection'),
						name: 'password_enabled',
						type: 'ToggleInput'
					}}
					bind:value={passwordEnabled}
				/>
			</div>

			{#if passwordEnabled}
				<div class="max-w-md">
					<PasswordInput
						autocomplete="off"
						block={{
							label: $_('label.password'),
							help: $_('help.form_password'),
							name: 'password',
							type: 'PasswordInput',
							required: true
						}}
						bind:value={$form.password}
					/>
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-3">
			<div class="text-lg opacity-60">{$_('title.captcha')}</div>

			<div class="flex flex-col gap-6 max-w-md">
				<ToggleInput
					block={{
						label: $_('label.invisible_captcha'),
						help: $_('help.invisible_captcha'),
						name: 'captchaInvisible'
					}}
					bind:value={$form.captchaInvisible}
				/>

				<ToggleInput
					block={{
						label: $_('label.captcha_auto'),
						help: $_('help.captcha_auto'),
						name: 'captchaAuto'
					}}
					disabled={$form.captchaInvisible}
					bind:value={$form.captchaAuto}
				/>

				<SelectInput
					block={{
						label: $_('label.captcha_complexity'),
						help: $_('help.captcha_complexity'),
						name: 'captchaComplexity',
						options: {
							options: [
								{
									label: $_('complexity.low'),
									value: 'low'
								},
								{
									label: $_('complexity.medium'),
									value: 'medium'
								},
								{
									label: $_('complexity.high'),
									value: 'high'
								}
							]
						}
					}}
					bind:value={$form.captchaComplexity}
				/>
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<div class="text-lg opacity-60">{$_('title.encryption_key')}</div>
			<div class="max-w-md">
				<SelectInput
					block={{
						label: $_('label.encryption_key'),
						help: $_('help.encryption_key'),
						name: 'encryptionKeyHash',
						options: {
							options: [
								{
									label: $_('label.automatic'),
									value: null
								},
								...data.encryptionKeys.map((key) => {
									return {
										label: key.hash,
										value: key.hash
									};
								})
							]
						}
					}}
					error={!encryptionKeyOk ? $_('error.invalid_encryption_key_selected') : void 0}
					bind:value={$form.encryptionKeyHash}
				/>
			</div>
		</div>

		<StickyButtons disabled={!changed} {loading}></StickyButtons>
	</div>
</Form>
