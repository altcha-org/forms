<script lang="ts">
	import { _, t } from 'svelte-i18n';
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { form } from '$lib/stores';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import FontIcon from '$lib/components/icons/Font.svelte';
	import FormUpload from '$lib/components/FormUpload.svelte';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import Tabs from '$lib/components/Tabs.svelte';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeft.svelte';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import UploadIcon from '$lib/components/icons/Upload.svelte';
	import type { IFormBlockPartial, IPdfInputOptions } from '$lib/types';

	interface IPDFJS {
		getDocument: (options: { data: ArrayBuffer }) => { promise: Promise<IPDFJSDocument> };
	}

	interface IPDFJSDocument {
		getPage: (n: number) => Promise<IPDFJSDocumentPage>;
		numPages: number;
	}

	interface IPDFJSDocumentPage {
		getViewport: (options: unknown) => { height: number; width: number };
		render: (options: unknown) => { promise: Promise<unknown> };
	}

	export let blocks: IFormBlockPartial[] = [];
	export let maxFileSize: number = 1024 * 1024;
	export let submitUrl: string = `/app/forms/${$form.id}/file`;
	export let options: IPdfInputOptions = {
		elements: [],
		fileId: null,
		fileName: null,
		fontColor: '#000000',
		fontFamily: 'sans-serif',
		fontSize: '12'
	};

	const computedFields = [
		{
			label: $_('label.current_date'),
			name: 'current_date'
		}
	];

	let doc: IPDFJSDocument | null = null;
	let dragBoundary: ReturnType<typeof elViewport.getBoundingClientRect>;
	let dragOffsetX: number = 0;
	let dragOffsetY: number = 0;
	let elFileInput: HTMLInputElement;
	let elViewport: HTMLElement;
	let elWrap: HTMLElement;
	let error: string | null = null;
	let file: File | null = null;
	let files: FileList;
	let loading: boolean = false;
	let pages: number = 0;
	let pageCanvas: HTMLCanvasElement | null = null;
	let selectedPage: number = 1;
	let showAllFields: boolean = false;
	let tab: 'fields' | 'computed' = 'fields';
	let view: 'font' | null = null;
	let zoom: number = 1;

	$: file = files?.[0] || null;
	$: filteredBlocks = showAllFields
		? blocks
		: blocks.filter(({ type }) => type && ['SignatureInput'].includes(type));
	$: onSelectedPageChange(selectedPage);
	$: onFileChange(file);

	onDestroy(() => {
		if (doc) {
			doc = null;
		}
	});

	onMount(() => {
		setTimeout(() => {
			resize();
		}, 200);
		if (options.fileId) {
			loadUploadedFile();
		}
		toggleElements();
	});

	function resize() {
		const container = elWrap?.closest('[data-modal-container]');
		if (container) {
			const boundary = container.getBoundingClientRect();
			elWrap.style.height = boundary.height + 'px';
		}
	}

	function onFileChange(_: typeof file) {
		error = null;
		if (file) {
			if (file.size > maxFileSize) {
				// workaround for a strange svelte store error
				error = get(t)('error.file_too_large');
				if (elFileInput) {
					elFileInput.value = '';
				}
			} else {
				options.fileName = file.name;
				openPdf(file);
			}
		}
	}

	function onReupload() {
		if (confirm($_('text.confirm_pdf_reupload'))) {
			options.fileId = null;
			options.fileName = null;
			if (elFileInput) {
				elFileInput.value = '';
			}
			file = null;
		}
	}

	function onSelectedPageChange(_: typeof selectedPage) {
		if (selectedPage && elViewport) {
			renderPage(selectedPage);
		}
		toggleElements();
	}

	function toggleElements() {
		const els = [...(elViewport?.querySelectorAll('[data-element]') || [])] as HTMLElement[];
		els.forEach((el) => {
			const page = el.getAttribute('data-page');
			el.style.display = doc && page && +page === selectedPage ? 'flex' : 'none';
		});
	}

	function updateElements() {
		const els = [...(elViewport?.querySelectorAll('[data-element]') || [])] as HTMLElement[];
		els.map((el) => {
			const element = options.elements.find(({ id }) => id === el.id);
			if (element) {
				const boundary = el.getBoundingClientRect();
				if (boundary.width) {
					if (pageCanvas) {
						element.pageHeight = pageCanvas.height;
						element.pageWidth = pageCanvas.width;
					}
					element.height = Math.round(boundary.height);
					element.width = Math.round(boundary.width);
					element.x = Math.round(parseFloat(el.style.left));
					element.y = Math.round(parseFloat(el.style.top));
				}
			}
		});
		options = options;
	}

	async function loadUploadedFile() {
		error = null;
		loading = true;
		try {
			const resp = await fetch(`/storage/${options.fileId}?download=1`);
			if (resp.status !== 200) {
				throw new Error('Invalid server response.');
			}
			await openPdf(await resp.arrayBuffer());
		} catch (err) {
			error = $_('error.something_went_wrong');
		} finally {
			loading = false;
		}
	}

	async function loadPDFJS(src = '/vendor/pdfjs/pdf.min.mjs'): Promise<IPDFJS> {
		const exists = [...document.querySelectorAll('script')].find(
			(el) => el.getAttribute('src') === src
		);
		if (!exists) {
			const script = document.createElement('script');
			script.setAttribute('src', src);
			script.setAttribute('type', 'module');
			return new Promise((resolve, reject) => {
				script.addEventListener('error', () => {
					document.body.removeChild(script);
					reject(new Error('Unable to load script.'));
				});
				script.addEventListener('load', () => {
					// @ts-expect-error global ref
					resolve(window['pdfjsLib']);
				});
				document.body.appendChild(script);
			});
		}
		// @ts-expect-error global ref
		return window['pdfjsLib'];
	}

	async function openPdf(file: ArrayBuffer | File) {
		const pdf = await loadPDFJS();
		// @ts-expect-error ts error
		pdf.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs';
		const data = file instanceof ArrayBuffer ? file : await readFile(file);
		doc = await pdf.getDocument({ data }).promise;
		pages = doc.numPages;

		return renderPage(1);
	}

	async function readFile(file: Blob | File): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = reject;
			reader.onload = (ev) => {
				if (ev.target?.result) {
					resolve(ev.target.result as ArrayBuffer);
				}
			};
			reader.readAsArrayBuffer(file);
		});
	}

	async function renderPage(num: number = 1) {
		if (doc && elViewport) {
			const page = await doc.getPage(num);
			const viewport = page.getViewport({
				scale: window.devicePixelRatio
			});
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			if (zoom === 1) {
				zoom = Math.max(
					0.4,
					Math.min(
						Math.min(1, elViewport.parentElement!.clientHeight / viewport.height),
						Math.min(1, elViewport.parentElement!.clientWidth / viewport.width)
					)
				);
			}
			elViewport.style.height = viewport.height + 'px';
			elViewport.style.width = viewport.width + 'px';
			canvas.height = viewport.height;
			canvas.width = viewport.width;
			const renderTask = page.render({
				canvasContext: context,
				viewport: viewport
			});
			await renderTask.promise;
			if (pageCanvas) {
				if (elViewport.contains(pageCanvas)) {
					elViewport?.removeChild(pageCanvas);
				}
			}
			pageCanvas = canvas;
			elViewport?.appendChild(canvas);
			toggleElements();
			updateElements();
		}
	}

	function onDragOver(ev: MouseEvent) {
		ev.preventDefault();
	}

	function onDragStart(ev: DragEvent, scale: number = 1) {
		const target = ev.target as HTMLElement;
		ev.dataTransfer!.setData(
			'text',
			new URLSearchParams({
				block: target.getAttribute('data-block-name') || '',
				computed: target.getAttribute('data-computed') || ''
			}).toString()
		);
		dragBoundary = target.getBoundingClientRect();
		dragOffsetX = ev.clientX / scale - dragBoundary.left;
		dragOffsetY = ev.clientY / scale - dragBoundary.top;
	}

	function onDrop(ev: DragEvent) {
		ev.preventDefault();
		const params = new URLSearchParams(ev.dataTransfer?.getData('text') || '');
		let el = params.get('id')
			? (elViewport.querySelector(`#${params.get('id')}`) as HTMLElement)
			: null;
		const boundary = elViewport.getBoundingClientRect();
		const scale = +elViewport.style.zoom;
		const x = ev.clientX / scale - boundary.left - dragOffsetX;
		const y = ev.clientY / scale - boundary.top - dragOffsetY;
		if (!el) {
			const blockName = params.get('block');
			const computedName = params.get('computed') || void 0;
			const block = blockName ? blocks.find((b) => b.name === blockName) : null;
			options.elements = [
				...options.elements,
				{
					id: `elem-${Math.floor(Math.random() * 1e8)}`,
					height: dragBoundary.height,
					width: dragBoundary.width,
					x,
					y,
					computed: computedName,
					name: block?.name,
					page: selectedPage,
					pageHeight: pageCanvas?.height || 0,
					pageWidth: pageCanvas?.width || 0
				}
			];
		} else if (el) {
			el.style.top = y + 'px';
			el.style.left = x + 'px';
			updateElements();
		}
	}
</script>

<FormUpload
	files={[...(files || [])]}
	{submitUrl}
	on:upload={(ev) => {
		options.fileId = ev.detail.fileIds[0];
	}}
/>

<div bind:this={elWrap} class="flex flex-col">
	<div class="flex items-center gap-3 bg-base-200 px-3 h-12">
		<div class="grow text-sm truncate">
			{#if error}
				<span class="text-error">{error}</span>
			{:else if options.fileName}
				<span class="max-w-sm truncate font-bold">{options.fileName}</span>
			{:else}
				<span class="opacity-60">{$_('placeholder.select_file')}</span>
			{/if}
		</div>
		{#if doc}
			<div>
				<button type="button" class="btn btn-sm" on:click={() => (view = view ? null : 'font')}>
					<FontIcon class="w-4 h-4" />
					<span>{$_('button.font')}</span>
				</button>

				<button type="button" class="btn btn-sm" on:click={() => onReupload()}>
					<UploadIcon class="w-4 h-4" />
					<span>{$_('button.reupload')}</span>
				</button>
			</div>
			<div class="flex items-center gap-3">
				<div>{$_('label.page')}:</div>
				<select class="select select-sm select-bordered w-full max-w-xs" bind:value={selectedPage}>
					{#each Array(pages) as _, i}
						<option value={i + 1}>{i + 1}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<div class="grow flex bg-base-200 relative h-[calc(100%-5.3rem)]">
		<div class="shrink-0 w-72 bg-base-200 border-t-2 border-base-300 overflow-auto">
			<div class="flex flex-col gap-3 p-3 pt-1">
				<div class="text-sm">
					<Tabs
						bind:value={tab}
						class="!px-0 !gap-4"
						tabs={[
							{
								label: $_('label.fields'),
								value: 'fields'
							},
							{
								label: $_('label.computed'),
								value: 'computed'
							}
						]}
					></Tabs>
				</div>

				<div>
					<div class="italic text-sm opacity-60">{$_('text.drag_fields_to_pdf')}</div>
				</div>

				{#if tab === 'fields'}
					{#each filteredBlocks as block}
						{@const included = !!options.elements.find((el) => el.name === block.name)}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="flex items-center bg-warning/60 text-warning-content rounded px-2 py-1 cursor-move"
							draggable="true"
							data-block-name={block.name}
							on:dragstart={onDragStart}
						>
							<div class="grow">
								<div class="truncate">{block.label || block.name}</div>
								<div class="text-xs opacity-60">{$_('block.' + block.type)}</div>
							</div>
							<div>
								{#if included}
									<CheckIcon class="w-4 h-4" />
								{/if}
							</div>
						</div>
					{/each}

					<div>
						<button
							type="button"
							class="link text-sm"
							on:click|preventDefault={() => (showAllFields = !showAllFields)}
						>
							{showAllFields ? $_('button.show_only_signatures') : $_('button.show_all')}
						</button>
					</div>
				{:else if tab === 'computed'}
					{#each computedFields as field}
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<div
							class="flex items-center bg-warning/60 text-warning-content rounded px-2 py-1 cursor-move"
							draggable="true"
							data-computed={field.name}
							on:dragstart={onDragStart}
						>
							<div class="grow">
								<div class="truncate">{field.label}</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<div class="grow bg-gray-300 overflow-auto">
			{#if file || options.fileId}
				{#if error}
					<div class="flex flex-col justify-center items-center h-20">
						<div>
							<AlertIcon class="w-8 h-8 opacity-60" />
						</div>
						<div class="text-sm">
							{error}
						</div>
					</div>
				{/if}
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="mx-auto relative shadow-xl my-10"
					style="zoom:{zoom}"
					bind:this={elViewport}
					on:dragover={onDragOver}
					on:drop={onDrop}
				>
					{#if loading}
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="loading loading-spinner loading-xs"></span>
						</div>
					{/if}

					{#each options.elements as element}
						{@const block = blocks.find(({ name }) => name === element.name)}
						<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
						<div
							draggable="true"
							tabindex="0"
							data-element="true"
							data-page={element.page}
							data-block-name={element.name}
							id={element.id}
							class="absolute flex items-center justify-center bg-warning/50 text-warning-content p-2 z-[100] resize overflow-hidden outline-offset-1 outline-error focus:outline"
							class:hidden={!doc}
							style="width:{element.width}px;height:{element.height}px;top:{element.y}px;left:{element.x}px"
							on:dragstart={(ev) => {
								onDragStart(ev, +elViewport.style.zoom);
								ev.dataTransfer?.setData(
									'text',
									new URLSearchParams({
										id: ev.currentTarget?.id
									}).toString()
								);
							}}
							on:keydown={(ev) => {
								if (ev.key === 'Backspace') {
									ev.preventDefault();
									options.elements = options.elements.filter((e) => e !== element);
								}
							}}
							on:mouseup={() => {
								updateElements();
							}}
						>
							{#if element.computed}
								{$_('label.' + element.computed)}
							{:else}
								{block?.label || block?.name}
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex items-center justify-center p-3 h-full">
					<div class="flex flex-col gap-3 p-3 rounded-lg border-2 border-dashed border-gray-400">
						<div>
							<input
								type="file"
								accept=".pdf"
								class="file-input file-input-bordered file-input-primary"
								bind:this={elFileInput}
								bind:files
							/>
						</div>
						<div>
							<p class="italic text-sm opacity-60">{$_('text.select_pdf_file')}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		{#if view === 'font'}
			<div class="absolute inset-0 z-[110] bg-base-300 p-4">
				<div class="bg-base-100 flex flex-col gap-3 max-w-sm mx-auto p-4 rounded-md">
					<div class="flex">
						<button
							type="button"
							class="btn btn-sm btn-circle"
							on:click|preventDefault={() => (view = null)}
						>
							<ArrowLeftIcon class="w-4 h-4" />
						</button>
					</div>
					<SelectInput
						block={{
							label: $_('label.font'),
							name: 'font',
							options: {
								options: ['serif', 'sans-serif']
							}
						}}
						bind:value={options.fontFamily}
					/>

					<SelectInput
						block={{
							label: $_('label.font_size'),
							name: 'fontSize',
							options: {
								options: ['8', '10', '12', '14', '16', '18', '20']
							}
						}}
						bind:value={options.fontSize}
					/>

					<SelectInput
						block={{
							label: $_('label.font_color'),
							name: 'fontColor',
							options: {
								options: [
									{
										label: $_('color.black'),
										value: '#000000'
									},
									{
										label: $_('color.blue'),
										value: '#0000ff'
									},
									{
										label: $_('color.green'),
										value: '#00ff00'
									},
									{
										label: $_('color.red'),
										value: '#ff0000'
									}
								]
							}
						}}
						bind:value={options.fontColor}
					/>
				</div>
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-end gap-3 px-3 py-2 bg-base-200">
		<input
			type="range"
			min="0.1"
			max="1"
			step="0.1"
			class="range range-xs max-w-56"
			class:disabled={!files?.length && !options.fileId}
			bind:value={zoom}
		/>
		<span class="text-sm opacity-60">{Math.floor(zoom * 100)} %</span>
	</div>
</div>
