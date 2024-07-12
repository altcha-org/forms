<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDown.svelte';
	import ArrowUpIcon from '$lib/components/icons/ArrowUp.svelte';
	import PdfIcon from '$lib/components/icons/Pdf.svelte';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { getTimeZone, solveAltcha, uploadFile } from '$lib/helpers';
	import type { Payload as AltchaPayload, Challenge as AltchaChallenge } from 'altcha-lib/types';
	import type { IForm, IFormBlock, IPdfInputOptions } from '$lib/types';

	export let block: IFormBlock<{
		expanded?: boolean;
		fileName?: string;
		pdf: IPdfInputOptions
		text?: string;
	}>;
	export let form: IForm | undefined = void 0;
	export let preview: boolean = false;
	export let generatePdfUrl: string = `${$page.url.pathname}/pdf`;
	export let submitUrl: string = `${$page.url.pathname}/file`;

	let collapsed: boolean = true;
	let el: HTMLElement;
	let elForm: HTMLFormElement | null = null;
	let fileId: string | null = null;
	let generating: boolean = false;

	$: pdfFileId = block.options?.pdf?.fileId || '';
	$: fileName = block.options.fileName || block.options?.pdf?.fileName || '';
	$: text = block.options?.text || '';
	$: collapsed = !block.options?.expanded;
	$: pdfBlocks = form ? form.steps.reduce((acc, { blocks }) => {
		return [...acc, ...blocks.filter(({ type }) => type === 'PdfInput')];
	}, [] as IFormBlock[]) : [] as IFormBlock[];
	$: index = pdfBlocks.indexOf(block);
	$: pdfLink = `/storage/${pdfFileId}`;

	onMount(() => {
		elForm = el.closest('form');
		elForm?.addEventListener('submit', onFormSubmit, {
			capture: true
		});
	});

	function getSignatureData() {
		const canvases = [...elForm?.querySelectorAll('[data-signature-canvas]') || []] as HTMLCanvasElement[];
		return canvases.reduce((acc, canvas) => {
			acc[canvas.getAttribute('data-signature-canvas')!] = canvas.toDataURL('image/jpeg', 0.85);
			return acc;
		}, {} as Record<string, string>);
	}

	function normalizeFileName(name: string) {
		name = name.replace(/[^\w]+/g, '_');
		return name.endsWith('.pdf') ? name : name + '.pdf';
	}

	async function generatePdfFetch(data: Record<string, string | FormDataEntryValue>, altcha?: AltchaPayload) {
		const headers: Record<string, string> = {
			'content-type': 'application/json'
		};
		if (altcha) {
			headers['authorization'] = `Altcha payload=${JSON.stringify(altcha)}`;
		}
		const resp = await fetch(generatePdfUrl, {
			body: JSON.stringify({
				data,
				index,
				locale: form?.locale,
				tz: getTimeZone(),
			}),
			headers,
			method: 'POST',
		});	
		if (resp.status === 401 && !altcha) {
			const auth = resp.headers.get('www-authenticate');
			if (auth && !altcha) {
				const solution = await solveAltcha(auth);
				if (solution) {
					return generatePdfFetch(data, solution);
				}
			}
			throw new Error('Invalid server response.');
		}
		return resp;
	}

	async function generatePdf() {
		const data = {
			...(elForm ? Object.fromEntries(new FormData(elForm)) : {}),
			...getSignatureData(),
		};
		const resp = await generatePdfFetch(data);
		if (resp.status !== 200) {
			throw new Error(`Server responded with ${resp.status}`);
		}
		return new File([await resp.blob()], normalizeFileName(fileName) || 'file.pdf', {
			type: 'application/pdf',
		});
	}

	async function onFormSubmit(ev: SubmitEvent) {
		if (form && !preview && !fileId) {
			ev.preventDefault();
			ev.stopPropagation();
			if (!generating) {
				generating = true;
				try {
					const file = await generatePdf();
					fileId = await uploadFile(file, submitUrl);
					requestAnimationFrame(() => {
						elForm?.requestSubmit();
					});
				} finally {
					generating = false;
				}
			}
		}
	}

</script>

<BaseInput {block}>
	<div bind:this={el} class="border border-base-content/30 rounded shadow-sm">
		{#if fileId}
			<input type="hidden" name={block.name} value={fileId} />
		{/if}

		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			class="flex items-center gap-3 --max-w-full h-12 px-3"
		>
			<div
				class="grow truncate"
			>
				<div
					class="flex gap-3 items-center cursor-pointer"
					on:click|preventDefault={() => collapsed = !collapsed}
				>
					<PdfIcon class="w-7 h-7" />
					<div class="font-bold truncate">{fileName}</div>
				</div>
			</div>

			<div class="shrink-0 flex gap-2">
				<a href={pdfLink + '?download=1'}
					type="button"
					class="btn btn-sm btn-ghost"
				>
					<DownloadIcon class="w-4 h-5" />	
					<span>{$_('button.download')}</span>
				</a>	
				<button
					type="button"
					class="btn btn-sm btn-square btn-ghost"
					on:click|preventDefault={() => collapsed = !collapsed}
				>
					{#if collapsed}
					<ArrowDownIcon class="w-5 h-5" />
					{:else}
					<ArrowUpIcon class="w-5 h-5" />
					{/if}
				</button>	
			</div>
		</div>

		{#if text}
		<div class="prose max-w-full text-sm opacity-70 px-3 pb-2">
			<MarkdownRenderer value={text} />
		</div>
		{/if}

		{#if !collapsed}
		<div class="mx-3 mb-3 bg-base-300">
			<iframe src={pdfLink} title="PDF" class="w-full min-h-80"></iframe>
		</div>
		{/if}
	</div>
</BaseInput>