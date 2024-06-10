<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import CheckboxInput from '$lib/components/blocks/CheckboxInput.svelte';
	import { form } from '$lib/stores';

	let checked: boolean = false;
</script>

<div class="flex flex-col gap-6 rounded-md bg-error/10 p-5">
	<div>
		{$_('text.delete_form')}
	</div>

	<div class="flex items-center gap-3">
		<div class="grow">
			<CheckboxInput
				block={{
					label: $_('label.delete_form', { values: { name: $form.name } }),
					name: 'confirm',
					type: 'CheckboxInput'
				}}
				bind:value={checked}
			/>
		</div>

		<div>
			<Form action="?/deleteForm" confirmText={$_('text.confirm_delete_form')}>
				<button type="submit" class="btn btn-error" disabled={!checked}>
					{$_('button.confirm')}
				</button>
			</Form>
		</div>
	</div>
</div>
