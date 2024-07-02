<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import SignatureCanvas from '$lib/components/SignatureCanvas.svelte';
	import SignatureUpload from '$lib/components/SignatureUpload.svelte';
	import { Pdf } from '$lib/pdf';
	import { formatDateTime } from '$lib/format';
	import { forceDownload, uploadFile } from '$lib/helpers';
	import type { IForm, IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let form: IForm | undefined = void 0;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let uploadUrl: string = `${$page.url.pathname}/file`;
	export let value: string | null = null;
	export let visible: boolean = true;

	let changed: boolean = false;
	let elInput: HTMLInputElement;
	let elForm: HTMLFormElement | null = null;
	let file: File | null = null;
	let signatureCanvas: SignatureCanvas | null = null;

	$: kind = block.options?.kind || 'drawn';

	onMount(() => {
		elForm = elInput.closest('form');
		elForm?.addEventListener('submit', onFormSubmit, {
			capture: true
		});
	});

	function generatePdf() {
		const data = Object.fromEntries(new FormData(elForm!)) as Record<string, any>;
		const pdf = new Pdf({
			pageNumbers: true
		});
		if (signatureCanvas) {
			const { height, width } = signatureCanvas.getDimensions();
			const imageWidth = pdf.maxX * 0.5;
			data[block.name] = {
				image: signatureCanvas.toImage(),
				format: 'jpeg',
				width: imageWidth,
				height: imageWidth * (height / width)
			};
		}
		pdf.form(form!, data, {
			signature: true
		});
		pdf.footer(
			`${formatDateTime(new Date(), void 0, void 0, {
				timeStyle: 'long'
			})}\n${form?.id || ''}`
		);
		return pdf.buffer();
	}

	function onDownload() {
		forceDownload(generatePdf(), `signature_${form!.id}.pdf`, 'application/pdf');
	}

	async function onFormSubmit(ev: SubmitEvent) {
		if (form && !preview && !value && changed) {
			ev.preventDefault();
			ev.stopPropagation();
			if (!file) {
				file = new File([generatePdf()], `signature_${form!.id}.pdf`, {
					type: 'application/pdf'
				});
			}
			const fileId = await uploadFile(file, uploadUrl);
			if (fileId) {
				requestAnimationFrame(() => {
					elForm?.requestSubmit();
				});
				value = fileId;
			} else {
				// TODO: error
			}
		}
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<input bind:this={elInput} type="hidden" name={block.name} {value} />

	<div
		class="input input-bordered shadow-sm h-auto min-h-auto p-0"
		class:overflow-auto={preview}
		class:max-w-md={kind === 'drawn'}
	>
		{#if kind !== 'drawn'}
			<div class="p-3 min-w-80">
				<SignatureUpload
					{block}
					certificate={kind === 'certificate'}
					{preview}
					{visible}
					bind:changed
					bind:file
					on:download={() => onDownload()}
				/>
			</div>
		{:else}
			<SignatureCanvas
				class="h-52"
				bind:changed
				bind:this={signatureCanvas}
				on:download={() => onDownload()}
			/>
			{#if block.required && !preview && visible && !changed}
				<input
					type="text"
					required
					class="absolute bottom-3 left-0 w-full h-[1px] opacity-[0.01]"
				/>
			{/if}
		{/if}
	</div>
</BaseInput>
