<script lang="ts">
	import { _ } from 'svelte-i18n';
	import slugify from 'slugify';
	import FormBlockAdd from '$lib/components/FormBlockAdd.svelte';
	import FormBlockEdit from '$lib/components/FormBlockEdit.svelte';
	import FormBlocksItem from '$lib/components/FormBlocksItem.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import List from '$lib/components/List.svelte';
	import AddBlockIcon from '$lib/components/icons/AddBlock.svelte';
	import PdfCanvas from '$lib/components/PdfCanvas.svelte';
	import { clone } from '$lib/helpers';
	import type { IFormBlock, IPdfInputOptions } from '$lib/types';

	export let blocks: IFormBlock[] = [];

	let editBlock: [number, IFormBlock] | undefined = void 0;
	let pdfBlock: [number, IFormBlock] | undefined = void 0;
	let modalAddBlockOpen: boolean = false;
	let modalOpen: boolean = false;
	let modalPdfOpen: boolean = false;
	let pdfOptions: IPdfInputOptions;

	$: onEditBlockChange(editBlock);
	$: onPdfBlockChange(pdfBlock);

	function onMoveBefore(block: IFormBlock, sourceIdx: number) {
		const targetIdx = blocks.indexOf(block);
		const source = blocks[sourceIdx];
		blocks.splice(sourceIdx, 1);
		blocks.splice(targetIdx, 0, source);
		blocks = blocks;
	}

	function onAddClick() {
		modalAddBlockOpen = true;
	}

	function onRemoveBlock(block: IFormBlock) {
		if (confirm($_('text.confirm_remove', { values: { name: block.label || block.name || '' } }))) {
			blocks = blocks.filter((b) => b !== block);
		}
	}

	function onEditBlockChange(_: typeof editBlock) {
		modalOpen = !!editBlock;
	}

	function onPdfBlockChange(_: typeof editBlock) {
		if (pdfBlock) {
			pdfOptions = pdfBlock[1].options.pdf as IPdfInputOptions;
		}
		modalPdfOpen = !!pdfBlock;
	}

	function onPdfSubmit() {
		if (pdfBlock) {
			pdfBlock[1].options.pdf = pdfOptions;
			blocks[pdfBlock[0]] = pdfBlock[1];
			blocks = blocks;
			pdfBlock = void 0;
		}
	}
</script>

<List
	items={blocks}
	let:item={block}
	let:index={idx}
	on:dblclick={(ev) => (editBlock = [ev.detail.idx, clone(ev.detail.item)])}
>
	<FormBlocksItem
		{block}
		{idx}
		on:edit={() => (editBlock = [idx, clone(block)])}
		on:movebefore={(ev) => onMoveBefore(block, ev.detail.idx)}
		on:remove={() => onRemoveBlock(block)}
		on:pdf={() => pdfBlock = [idx, clone(block)]}
	/>

	<div slot="end" class="border-t border-base-300 bg-base-200/50 p-3">
		<button
			type="button"
			class="btn btn-primary btn-sm"
			on:click|preventDefault={() => onAddClick()}
		>
			<AddBlockIcon class="w-4 h-4" />
			<span>{$_('button.add_block')}</span>
		</button>
	</div>
</List>

<Modal
	bind:open={modalAddBlockOpen}
	action=""
	medium
	title={$_('title.add_block')}
	buttonLabel={$_('button.add')}
	on:submit={(ev) => {
		const label = ev.detail.data?.get('label');
		const type = ev.detail.data?.get('type');
		blocks = [
			...blocks,
			{
				label: label || 'New block',
				name: label
					? slugify(label, {
							lower: true,
							replacement: '_',
							trim: true
						})
					: type.replace(/Input|Layout/, '').toLowerCase(),
				options: {},
				required: false,
				type: type || 'TextInput'
			}
		];
	}}
>
	{#if modalAddBlockOpen}
		<FormBlockAdd />
	{/if}
</Modal>

<Modal
	bind:open={modalOpen}
	action=""
	medium
	title={editBlock?.[1]?.label || editBlock?.[1]?.name || ''}
	subtitle={editBlock?.[1].type ? $_('block.' + editBlock?.[1].type) : void 0}
	buttonLabel={$_('button.apply')}
	on:close={() => {
		editBlock = void 0;
	}}
	on:submit={() => {
		if (editBlock) {
			blocks[editBlock[0]] = editBlock[1];
		}
		blocks = blocks;
	}}
>
	{#if editBlock}
		<FormBlockEdit blockOriginal={blocks[editBlock[0]]} bind:block={editBlock[1]} />
	{/if}
</Modal>

<Modal
	action=""
	title={$_('title.pdf_document')}
	buttonLabel={$_('button.apply')}
	large
	padding={false}
	bind:open={modalPdfOpen}
	on:submit={() => onPdfSubmit()}
>
	{#if modalPdfOpen}
	<PdfCanvas
		blocks={blocks.filter(({ type }) => type.endsWith('Input'))}
		bind:options={pdfOptions}
	/>	
	{/if}
</Modal>
