<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import CheckboxInput from '$lib/components/blocks/CheckboxInput.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let checked: boolean = false;
</script>

<div class="flex flex-col gap-6 rounded-md bg-error/10 p-5">
	<div>
		{$_('text.delete_account', { values: { account: data.account.name } })}
	</div>

	<div class="flex items-center gap-3">
		<div class="grow">
			<div class="flex">
				<CheckboxInput
					block={{
						label: $_('label.delete_account'),
						name: 'confirm',
						type: 'CheckboxInput'
					}}
					bind:value={checked}
				/>
			</div>
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
