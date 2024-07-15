<script lang="ts">
	import { _ } from 'svelte-i18n';
	import EmailInput from '$lib/components/blocks/EmailInput.svelte';
	import Form from '$lib/components/Form.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';

	let submitted = false;
</script>

<div class="bg-base-100 p-5 md:rounded-xl md:shadow-lg w-full md:max-w-sm">
	<Form discardUnsaved successToast={false} on:submit={() => (submitted = true)} let:loading>
		<div class="flex flex-col gap-6">
			<div class="text-xl font-light">{$_('title.recover_access')}</div>

			{#if submitted}
				<div class="flex flex-col items-center gap-3 bg-base-200 p-5 rounded-md">
					<div>
						<CheckIcon class="w-6 h-6 opacity-60" />
					</div>
					<div class="text-center">{$_('text.recover_access_sent')}</div>
				</div>
			{:else}
				<div>
					<p>{$_('text.recover_access')}</p>
				</div>

				<EmailInput
					autocomplete="off"
					block={{
						label: $_('label.email'),
						name: 'email',
						readonly: loading,
						required: true,
						type: 'EmailInput'
					}}
				/>

				<div>
					<button type="submit" class="btn btn-primary w-full" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{:else}
							{$_('button.next')}
						{/if}
					</button>
				</div>
			{/if}

			<div class="flex justify-center gap-4">
				<div class="text-sm">
					<a href="/app/authentication" class="link">{$_('button.authenticate')}</a>
				</div>
			</div>
		</div>
	</Form>
</div>
