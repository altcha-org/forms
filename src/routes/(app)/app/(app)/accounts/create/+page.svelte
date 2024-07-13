<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import Form from '$lib/components/Form.svelte';
	import Page from '$lib/components/Page.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';

	let plan: string = 'team';
</script>

<Page>
	<div class="flex flex-col gap-6">
		<div>
			<div class="text-2xl font-bold">{$_('title.create_account')}</div>
		</div>

		<div>
			<p>{$_('text.create_account')}</p>
		</div>

		<Form class="flex flex-col gap-12" discardUnsaved on:reset={() => goto('/app/accounts')}>
			<input type="hidden" name="plan" value={plan} />

			<div class="max-w-lg">
				<TextInput
					block={{
						label: $_('label.name'),
						help: $_('help.account_name'),
						name: 'name',
						required: true,
						type: 'TextInput'
					}}
				/>
			</div>

			<StickyButtons buttonLabel={$_('button.next')} />
		</Form>
	</div>
</Page>
