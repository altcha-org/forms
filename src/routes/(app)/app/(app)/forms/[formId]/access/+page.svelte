<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { form } from '$lib/stores';
	import { clone } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;
	let changed: boolean = false;

	$: changed = JSON.stringify(data.form) !== JSON.stringify($form);

	$: groupedUsers = data.users.reduce(
		(acc, user) => {
			if (!acc[user.role]) {
				acc[user.role] = [];
			}
			acc[user.role].push(user);
			return acc;
		},
		{} as Record<string, (typeof data.users)[number][]>
	);

	function onReset() {
		if (changed && confirm($_('text.confirm_unsaved_changes'))) {
			$form = clone(data.form);
		}
	}
</script>

<Form
	action="?/updateAccess"
	data={{
		users: data.formUsers
	}}
	on:reset={() => onReset()}
	let:changed
	let:loading
>
	<div class="flex flex-col gap-6">
		<div>
			<Alert variant="primary">
				<MarkdownRenderer
					value={$form.restricted ? $_('text.form_restricted') : $_('text.form_unrestricted')}
				/>
			</Alert>
		</div>

		<div>
			<ToggleInput
				block={{
					label: $_('label.restricted_access'),
					help: $_('help.restricted_access'),
					name: 'restricted'
				}}
				bind:value={$form.restricted}
			/>
		</div>

		{#if $form.restricted}
			<div class="flex flex-col gap-2 border border-base-300 rounded-md p-3 max-w-lg">
				{#each Object.keys(groupedUsers) as role}
					<div class="opacity-60">{$_('role.' + role)}</div>
					{#each groupedUsers[role] as user}
						<div class="flex items-center gap-3">
							{#if role === 'admin'}
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									id={'user_' + user.userId}
									checked
									disabled
								/>
							{:else}
								<input
									type="checkbox"
									class="checkbox checkbox-sm"
									id={'user_' + user.userId}
									value={user.userId}
									readonly={role === 'admin'}
									bind:group={data.formUsers}
								/>
							{/if}

							<div>
								<label for={'user_' + user.userId}>{user.name}</label>
							</div>
						</div>
					{/each}
				{/each}
			</div>
		{/if}

		<StickyButtons disabled={!changed} {loading}></StickyButtons>
	</div>
</Form>
