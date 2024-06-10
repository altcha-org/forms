<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatTimeAgo } from '$lib/format';
	import { decryptData } from '$lib/helpers';
	import Form from '$lib/components/Form.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import List from '$lib/components/List.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import EmailCheckIcon from '$lib/components/icons/EmailCheck.svelte';
	import ResponseDataProvider from '$lib/components/ResponseDataProvider.svelte';
	import { encryptionKeys } from '$lib/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	let noteText: string = '';
	let sendToEmail: boolean = false;
	let updateNote: (typeof data.notes)[number] | null = null;

	$: emailBlockName = data.form.steps.reduce(
		(acc, step) => {
			if (!acc) {
				for (const block of step.blocks) {
					if (block.type === 'EmailInput') {
						return block.name;
					}
				}
			}
			return acc;
		},
		null as string | null
	);

	function onNoteUpdate(note: (typeof data.notes)[number], text: string | null) {
		if (text !== null) {
			sendToEmail = false;
			updateNote = note;
			noteText = text;
		}
	}

	function reset() {
		updateNote = null;
		noteText = '';
		sendToEmail = false;
	}
</script>

<List items={data.notes} let:item={note}>
	<svelte:fragment slot="no_items">
		<div class="italic opacity-60">{$_('text.no_notes')}</div>
	</svelte:fragment>

	{@const canEdit = data.user && note.user?.id === data.user.id}
	<div class="flex flex-wrap items-center gap-3">
		<div class="grow">
			<div>
				<span class="font-bold truncate">{note.user?.name}</span>
			</div>
		</div>

		<div class="flex gap-2 items-center">
			{#if note.sentToEmailAt}
				<div class="tooltip" data-tip={$_('tooltip.sent_to_email')}>
					<EmailCheckIcon class="w-4 h-4" />
				</div>
			{/if}

			<span class="opacity-60 text-sm">{formatTimeAgo(note.createdAt)}</span>

			{#if note.updatedAt > note.createdAt}
				<span class="opacity-60 text-sm">({$_('label.edited')})</span>
			{/if}
		</div>

		<div>
			{#if canEdit}
				<div class="dropdown dropdown-end dropdown-bottom">
					<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
						<MoreHorizontalIcon class="w-4 h-4" />
					</div>
					<DropdownMenu autoclose>
						<ul class="menu gap-1">
							<li class="menu-title">{$_('label.actions')}</li>
							<li>
								<button type="button" on:click|preventDefault={() => onNoteUpdate(note, note.text)}
									>{$_('button.edit')}</button
								>
							</li>
							<li>
								<Form
									action="?/deleteNote"
									class="grow flex"
									confirmText={$_('text.confirm_remove', { values: { name: note.id } })}
									data={{
										noteId: note.id
									}}
								>
									<button type="submit" class="grow flex items-center">
										<span class="grow text-left">{$_('button.delete')}</span>
										<DeleteIcon class="w-4 h-4" />
									</button>
								</Form>
							</li>
						</ul>
					</DropdownMenu>
				</div>
			{/if}
		</div>
	</div>

	<div class="prose">
		{#if note.encrypted && note.textEncrypted && note.encryptionKeyHash}
			{#await decryptData(note.textEncrypted, note.encryptionKeyHash, $encryptionKeys)}
				<div>...</div>
			{:then text}
				{#if text === null}
					<div class="opacity-60 italic">{$_('label.encrypted')}</div>
				{:else}
					<!-- re-assign note.text to decrypted to make update work -->
					{@const _t = note.text = text}
					<MarkdownRenderer value={text || ''} />
				{/if}
			{/await}
		{:else if note.text}
			<MarkdownRenderer value={note.text} />
		{/if}
	</div>
</List>

<div>
	<Form
		action={updateNote ? '?/updateNote' : '?/addNote'}
		data={{
			noteId: updateNote?.id
		}}
		let:loading
		on:submit={() => reset()}
	>
		<div class="flex flex-col gap-6">
			<div class="flex flex-col">
				<MultiLineTextInput
					bind:value={noteText}
					block={{
						label: $_('label.note'),
						help: $_('help.add_response_note'),
						name: 'text',
						options: {
							rows: 2
						}
					}}
					markdown
				/>

				<ResponseDataProvider response={data.response} let:responseData>
					{@const email = emailBlockName ? responseData?.[emailBlockName] : null}

					{#if email}
						<input type="hidden" name="sendToEmail" value={email} />
					{/if}

					<ToggleInput
						block={{
							label: $_('label.send_to_respondent_email'),
							name: 'sendToEmailToggle'
						}}
						disabled={!email || !!updateNote}
						bind:value={sendToEmail}
					/>

					{#if sendToEmail && email}
						<div class="mt-3">
							<Alert variant="warning">
								<MarkdownRenderer
									value={$_('text.note_send_to_email', { values: { email: String(email) } })}
								/>
							</Alert>
						</div>
					{/if}
				</ResponseDataProvider>
			</div>

			<div class="flex gap-3">
				<button type="submit" class="btn btn-primary" disabled={!noteText || loading}>
					{updateNote ? $_('button.update') : $_('button.submit')}
				</button>

				{#if updateNote}
					<button type="button" class="bt" on:click={() => reset()}>
						{$_('button.cancel')}
					</button>
				{/if}
			</div>
		</div>
	</Form>
</div>
