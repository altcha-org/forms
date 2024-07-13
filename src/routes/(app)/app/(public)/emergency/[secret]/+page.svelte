<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import EmailInput from '$lib/components/blocks/EmailInput.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import { getDeviceName, getTimeZone } from '$lib/helpers';
</script>

<div class="bg-base-100 p-5 md:rounded-xl md:shadow-lg w-full md:max-w-sm">
	<Form
		discardUnsaved
		data={{
			deviceName: getDeviceName(),
			deviceTimezone: getTimeZone()
		}}
		let:loading
	>
		<div class="flex flex-col gap-6">
			<div class="text-xl font-light">{$_('title.emergency_access')}</div>

			<div>
				<p>{$_('text.emergency_access')}</p>
			</div>

			<EmailInput
				autocomplete="off"
				block={{
					label: $_('label.email'),
					name: 'email',
					readonly: loading,
					required: true
				}}
			/>

			<PasswordInput
				autocomplete="off"
				block={{
					label: $_('label.password'),
					name: 'password',
					readonly: loading,
					required: true
				}}
			/>

			<div>
				<button type="submit" class="btn btn-primary w-full" disabled={loading}>
					{#if loading}
						<span class="loading loading-spinner"></span>
					{:else}
						{$_('button.authenticate')}
					{/if}
				</button>
			</div>
		</div>
	</Form>
</div>
