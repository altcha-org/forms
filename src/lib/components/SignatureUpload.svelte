<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import { forceDownload } from '$lib/helpers';
	import { Pdf } from '$lib/pdf';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import LockIcon from './icons/Lock.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let certificate: boolean = false;
	export let changed: boolean = false;
	export let file: File | null = null;
	export let preview: boolean = false;
	export let visible: boolean = true;

	const dispatch = createEventDispatcher();

	let hasSignature: boolean = false;

	$: accept = certificate ? '.pdf' : null;

	function onDownload() {
		dispatch('download');
	}

	function onFileChange(ev: Event & { currentTarget: HTMLInputElement }) {
		hasSignature = false;
		if (ev.currentTarget.files?.[0]) {
			file = ev.currentTarget.files?.[0];
			if (certificate) {
				const reader = new FileReader();
				reader.addEventListener('load', () => {
					if (reader.result) {
						hasSignature = Pdf.hasSignature(String(reader.result));
						changed = true;
					}
				});
				reader.readAsText(file);
			}
		}
	}
</script>

<div class="relative">
	<div class="flex flex-col gap-4">
		<div class="flex gap-2 lg:gap-4">
			<div>
				<div class="flex items-center justify-center bg-base-content/5 rounded-full w-8 h-8">1</div>
			</div>
			<div class="flex flex-col gap-1">
				<div>
					<button
						type="button"
						class="btn btn-sm btn-primary gap-2"
						on:click|preventDefault={() => onDownload()}
					>
						<DownloadIcon class="w-3 h-3" />
						<span>{$_('button.download')}</span>
					</button>
				</div>
				<div>
					<p class="text-sm opacity-60">{$_('help.signature_download_pdf')}</p>
				</div>
			</div>
		</div>

		<div class="flex gap-2 lg:gap-4">
			<div>
				<div class="flex items-center justify-center bg-base-content/5 rounded-full w-8 h-8">2</div>
			</div>
			<div>
				<div>{$_('text.sign_form')}</div>
				{#if certificate}
					<div>
						<p class="text-sm opacity-60">{$_('help.signature_sign_pdf_certificate')}</p>
					</div>
				{:else}
					<div>
						<p class="text-sm opacity-60">{$_('help.signature_sign_pdf')}</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="flex gap-2 lg:gap-4">
			<div>
				<div class="flex items-center justify-center bg-base-content/5 rounded-full w-8 h-8">3</div>
			</div>
			<div class="flex flex-col gap-1">
				<div>{$_('text.upload_signed_form')}</div>
				{#if certificate}
					<div>
						<p class="text-sm opacity-60">{$_('help.signature_upload_signed_pdf')}</p>
					</div>
				{:else}
					<div>
						<p class="text-sm opacity-60">{$_('help.signature_upload_signed')}</p>
					</div>
				{/if}
				<div>
					<input
						type="file"
						class="file-input file-input-sm file-input-primary file-input-bordered w-full max-w-xs"
						{accept}
						required={block.required && !preview && visible}
						on:change={onFileChange}
					/>
				</div>

				{#if file && certificate && !hasSignature}
					<div class="flex items-center gap-2 text-sm text-error">
						<AlertIcon class="w-4 h-4" />
						<span>{$_('error.file_not_signed_pdf')} </span>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if !preview && !file}
		<div class="absolute hidden xl:flex items-center -left-32 top-0">
			<div
				class="flex gap-2 items-center justify-center bg-error text-error-content rounded-l-md h-8 w-24 px-2"
			>
				<LockIcon class="w-4 h-4 shrink-0" />
				<span class="text-xs whitespace-nowrap truncate">{$_('text.sign')}</span>
			</div>
			<div class="w-0 h-0 border-[1rem] border-transparent border-l-error"></div>
		</div>
	{/if}
</div>
