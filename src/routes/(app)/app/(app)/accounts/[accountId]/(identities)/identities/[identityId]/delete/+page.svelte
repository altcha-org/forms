<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import CheckboxInput from '$lib/components/blocks/CheckboxInput.svelte';
  import type { PageData } from './$types';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

  export let data: PageData;

	let checked: boolean = false;
</script>

<div class="flex flex-col gap-6 rounded-md bg-error/10 p-5">
	<div>
		<MarkdownRenderer
			value={$_('text.delete_identity', { values: { id: data.identity.id, responses: data.totalResponses } })}
		/>
	</div>

	<div class="flex items-center gap-3">
		<div class="grow">
			<CheckboxInput
				block={{
					label: $_('label.delete_identity', { values: { id: data.identity.id } }),
					name: 'confirm',
					type: 'CheckboxInput'
				}}
				bind:value={checked}
			/>
		</div>

		<div>
			<Form action="?/deleteIdentity" confirmText={$_('text.confirm_delete_identity')}>
				<button type="submit" class="btn btn-error" disabled={!checked}>
					{$_('button.confirm')}
				</button>
			</Form>
		</div>
	</div>
</div>
