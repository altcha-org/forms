<script lang="ts">
	import { _ } from 'svelte-i18n';
	import availableProcessors from '$lib/consts/processors';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Form from '$lib/components/Form.svelte';
	import FormBlock from '$lib/components/blocks/FormBlock.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Sortable from '$lib/components/Sortable.svelte';
	import FeatureNotAvailable from '$lib/components/FeatureNotAvailable.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import EditIcon from '$lib/components/icons/Edit.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import List from '$lib/components/List.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import { clone } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	let modalOpen: boolean = false;
	let processors = clone(data.form.processors);
	let editProcessor: (typeof processors)[number] | undefined = void 0;

	$: canEdit = data.account?.plan?.featureProcessors === true;
	$: changed = JSON.stringify(data.form.processors) !== JSON.stringify(processors);
	$: processorConfigBlocks = availableProcessors.find(
		({ type }) => type === editProcessor?.type
	)?.configSchema;

	function onAddProcessor(processor: (typeof availableProcessors)[number]) {
		processors = [
			...processors,
			{
				config: {},
				enabled: true,
				type: processor.type
			}
		];
		onEdit(processors[processors.length - 1]);
	}

	function onEdit(processor: (typeof processors)[number]) {
		editProcessor = processor;
		modalOpen = true;
	}

	function onMoveBefore(targetIndex: number, sourceIndex: number) {
		const source = processors[sourceIndex];
		processors.splice(sourceIndex, 1);
		processors.splice(targetIndex, 0, source);
		processors = processors;
	}

	function onSave(formData: FormData) {
		if (editProcessor) {
			const configSchema = availableProcessors.find(
				({ type }) => type === editProcessor?.type
			)?.configSchema;
			if (configSchema) {
				editProcessor.config = configSchema.reduce(
					(acc, field) => {
						if (['CheckboxInput', 'ToggleInput'].includes(field.type)) {
							acc[field.name] = formData.get(field.name) === 'true';
						} else {
							acc[field.name] = formData.get(field.name) || null;
						}
						return acc;
					},
					{} as Record<string, unknown>
				);
			}
			processors = processors;
		}
	}

	function onRemove(processor: (typeof processors)[number]) {
		if (confirm($_('text.confirm_remove', { values: { name: processor.type } }))) {
			processors = processors.filter((p) => p !== processor);
		}
	}

	function onReset() {
		if (changed && confirm($_('text.confirm_unsaved_changes'))) {
			processors = clone(data.form.processors);
		}
	}
</script>

<Form
	action="?/upsertProcessors"
	{changed}
	on:reset={() => onReset()}
	on:submit={() => (processors = clone(data.form.processors))}
>
	<input type="hidden" name="processors" value={JSON.stringify(processors)} />

	<div class="flex flex-col gap-6">
		<div class="text-sm opacity-60">
			{$_('text.processors')}
		</div>

		{#if !canEdit}
			<FeatureNotAvailable account={data.account} />
		{/if}

		<List items={processors} let:item={processor} let:index={i}>
			<Sortable
				class="bg-base-100 rounded p-1 group border-base-300"
				index={i}
				on:movebefore={(ev) => onMoveBefore(i, ev.detail.index)}
			>
				<div class="flex gap-3">
					<div class="grow">
						<div class="font-bold">{$_('processor.name.' + processor.type)}</div>
						<div class="text-sm opacity-60">
							{processor.description || $_('processor.description.' + processor.type)}
						</div>
					</div>

					<div class="flex gap-1 items-center">
						{#if canEdit}
							<div class="dropdown dropdown-end">
								<div tabindex="0" role="button" class="btn btn-sm btn-square btn-ghost">
									<MoreHorizontalIcon class="w-4 h-4" />
								</div>
								<DropdownMenu autoclose>
									<ul class="menu gap-1">
										<li class="menu-title">{$_('label.actions')}</li>
										<li>
											<button
												type="button"
												class="flex grow justify-start items-center gap-3"
												on:click|preventDefault={() => onEdit(processor)}
											>
												<span class="grow text-left">{$_('button.edit')}</span>
												<EditIcon class="w-4 h-4" />
											</button>
										</li>
										<li>
											<button
												type="button"
												class="flex grow justify-start items-center gap-3"
												on:click|preventDefault={() => onRemove(processor)}
											>
												<span class="grow text-left">{$_('button.remove')}</span>
												<DeleteIcon class="w-4 h-4" />
											</button>
										</li>
									</ul>
								</DropdownMenu>
							</div>
						{/if}
					</div>
				</div>
			</Sortable>
		</List>

		<div>
			<div class="dropdown">
				<div tabindex="0" role="button" class="btn btn-sm gap-2" class:disabled={!canEdit}>
					<PlusIcon class="w-4 h-4" />
					<span>{$_('button.add_processor')}</span>
				</div>
				<DropdownMenu autoclose>
					<ul class="menu gap-1">
						<li class="menu-title">{$_('label.processors')}</li>
						{#each availableProcessors as processor}
							<li>
								<button type="button" on:click|preventDefault={() => onAddProcessor(processor)}>
									<span>{$_('processor.name.' + processor.type)}</span>
								</button>
							</li>
						{/each}
					</ul>
				</DropdownMenu>
			</div>
		</div>

		<StickyButtons disabled={!changed} />
	</div>
</Form>

<Modal
	action=""
	buttonLabel={$_('button.apply')}
	title={$_('processor.name.' + editProcessor?.type)}
	bind:open={modalOpen}
	on:submit={(ev) => onSave(ev.detail.data)}
>
	{#if editProcessor}
		<div class="flex flex-col gap-6">
			<TextInput
				block={{
					label: $_('label.description'),
					name: 'description'
				}}
				bind:value={editProcessor.description}
			/>

			{#if processorConfigBlocks}
				{#each processorConfigBlocks as block}
					<FormBlock {block} bind:value={editProcessor.config[block.name]}></FormBlock>
				{/each}
			{/if}
		</div>
	{/if}
</Modal>
