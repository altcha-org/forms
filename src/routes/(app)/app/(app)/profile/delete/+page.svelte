<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import CheckboxInput from '$lib/components/blocks/CheckboxInput.svelte';

	let checked: boolean = false;
</script>

<div class="flex flex-col gap-6 rounded-md bg-error/10 p-5">
	<div>
		{$_('text.delete_user')}
	</div>

	<div class="flex items-center gap-3">
		<div class="grow">
			<CheckboxInput
				block={{
					label: $_('label.delete_user'),
					name: 'confirm',
					type: 'CheckboxInput'
				}}
				bind:value={checked}
			/>
		</div>

		<div>
			<Form action="?/deleteProfile" confirmText={$_('text.confirm_delete_account')}>
				<button type="submit" class="btn btn-error" disabled={!checked}>
					{$_('button.confirm')}
				</button>
			</Form>
		</div>
	</div>
</div>
