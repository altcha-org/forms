<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import NumberInput from '$lib/components/blocks/NumberInput.svelte';
	import timezones from '$lib/timezones';
	import type { PageData } from './$types';

	export let data: PageData;

	let customSmtp: boolean = !!data.accountWithCredentials.smtpUrl;

	$: account = data.accountWithCredentials;
	$: auditlogAllowed = account.plan?.featureAuditlog === true;
	$: timeZoneOptions = timezones.map(([_, tz]) => tz).sort();
</script>

<Form action="?/updateAccount" class="flex flex-col gap-12" let:changed let:error>
	<div class="flex flex-col gap-12 max-w-lg">
		<TextInput
			block={{
				label: $_('label.account_name'),
				name: 'name',
				required: true
			}}
			error={error?.fields?.name}
			bind:value={account.name}
		/>

		<SelectInput
			block={{
				label: $_('label.timezone'),
				help: $_('help.account_timezone'),
				name: 'timeZone',
				options: {
					options: timeZoneOptions
				}
			}}
			bind:value={account.timeZone}
		/>

		<ToggleInput
			block={{
				label: $_('label.enable_encryption'),
				help: $_('help.enable_encryption'),
				name: 'encryptionEnabled'
			}}
			bind:checked={account.encryptionEnabled}
		/>
	</div>

	{#if auditlogAllowed}
		<div>
			<div class="text-xl">{$_('title.auditlog')}</div>
			<div>
				<p class="text-sm opacity-60">{$_('text.auditlog_info')}</p>
			</div>
		</div>

		<div class="flex flex-col gap-12 max-w-lg">
			<SelectInput
				block={{
					label: $_('label.auditlog'),
					help: $_('help.auditlog'),
					name: 'auditlog',
					options: {
						options: [
							{
								label: $_('label.off'),
								value: null
							},
							{
								label: $_('label.auditlog_changes'),
								value: 'changes'
							},
							{
								label: $_('label.auditlog_access'),
								value: 'access'
							}
						]
					}
				}}
				bind:value={account.auditlog}
			/>

			<NumberInput
				block={{
					label: $_('label.auditlog_retention'),
					help: $_('help.auditlog_retention'),
					name: 'auditlogRetention',
					options: {
						max: 365,
						min: 0
					}
				}}
				bind:number={account.auditlogRetention}
			/>
		</div>
	{/if}

	<div>
		<div class="text-xl">{$_('title.custom_smtp')}</div>
		<div>
			<p class="text-sm opacity-60">{$_('text.custom_smtp_info')}</p>
		</div>
	</div>

	<div class="flex flex-col gap-12 max-w-lg">
		<ToggleInput
			block={{
				label: $_('label.enable_custom_smtp'),
				name: ''
			}}
			bind:checked={customSmtp}
		/>

		<PasswordInput
			autocomplete="one-time-code"
			block={{
				label: $_('label.smtp_url'),
				help: $_('help.smtp_url'),
				name: 'smtpUrl',
				required: customSmtp
			}}
			error={error?.fields?.smtpUrl}
			disabled={!customSmtp}
			bind:value={account.smtpUrl}
		/>

		<TextInput
			block={{
				label: $_('label.smtp_sender'),
				help: $_('help.smtp_sender'),
				name: 'smtpSender',
				required: customSmtp
			}}
			error={error?.fields?.smtpSender}
			disabled={!customSmtp}
			bind:value={account.smtpSender}
		/>

		<div>
			<Form
				action="?/testSmtp"
				data={{
					smtpSender: account.smtpSender,
					smtpUrl: account.smtpUrl
				}}
				successToast={$_('notification.connection_successful')}
				let:loading
			>
				<button type="submit" class="btn btn-sm" disabled={loading || !customSmtp}
					>{$_('button.test_smtp')}</button
				>
			</Form>
		</div>
	</div>

	<StickyButtons disabled={!changed} />
</Form>
