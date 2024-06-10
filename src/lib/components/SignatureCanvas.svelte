<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import { createEventDispatcher, onMount } from 'svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import StampIcon from '$lib/components/icons/Stamp.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import SignatureIcon from '$lib/components/icons/Signature.svelte';
	import DownloadIcon from './icons/Download.svelte';
	import FontIcon from './icons/Font.svelte';
	import SignaturePad from 'signature_pad';

	export let changed: boolean = false;

	const dispatch = createEventDispatcher();

	let elCanvas: HTMLCanvasElement;
	let pad: SignaturePad;
	let stamp: HTMLImageElement | null = null;
	let text: string | null = null;

	onMount(() => {
		if (browser) {
			requestAnimationFrame(() => {
				initPad();
				redraw();
			});
		}
	});

	function initPad() {
		if (elCanvas) {
			pad = new SignaturePad(elCanvas);
			pad.addEventListener('endStroke', () => (changed = true));
		}
	}

	function onDownload() {
		dispatch('download');
	}

	function onTypeClick() {
		const str = prompt($_('label.your_name'));
		if (str) {
			text = str;
			changed = true;
			redraw();
		}
	}

	function onUploadClick() {
		const input = document.createElement('input');
		const reader = new FileReader();
		input.type = 'file';
		input.click();
		input.addEventListener('change', (ev) => {
			const file = (ev.target as any).files[0] as File;
			reader.readAsDataURL(file);
			reader.addEventListener('load', (_ev) => {
				const img = new Image();
				img.addEventListener('load', () => {
					stamp = img;
					changed = true;
					redraw();
				});
				img.src = (_ev.target as any).result;
			});
		});
	}

	function renderBackground(color: string = '#ffffff') {
		const ctx = elCanvas.getContext('2d');
		if (ctx) {
			ctx.fillStyle = color;
			ctx.fillRect(0, 0, elCanvas.offsetWidth, elCanvas.offsetHeight);
		}
	}

	function renderLine() {
		const ctx = elCanvas.getContext('2d');
		if (ctx) {
			const offset = elCanvas.offsetHeight * 0.75;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(0, offset);
			ctx.lineTo(elCanvas.offsetWidth, offset);
			ctx.strokeStyle = '#00000044';
			ctx.stroke();
		}
	}

	function renderImage(img: HTMLImageElement, scale: number = 0.8) {
		const ctx = elCanvas.getContext('2d');
		if (ctx) {
			const hRatio = (elCanvas.offsetWidth / img.width) * scale;
			const vRatio = (elCanvas.offsetHeight / img.height) * scale;
			const ratio = Math.min(hRatio, vRatio);
			ctx?.drawImage(
				img,
				0,
				0,
				img.width,
				img.height,
				30,
				10,
				img.width * ratio,
				img.height * ratio
			);
			changed = true;
		}
	}

	function renderText(str: string, color: string = '#000000') {
		const ctx = elCanvas.getContext('2d');
		if (ctx) {
			const offset = elCanvas.offsetHeight * 0.7;
			ctx.font = '28px cursive';
			const width = ctx.measureText(str).width;
			ctx.fillStyle = color;
			ctx.fillText(str, (elCanvas.offsetWidth - width) / 2, offset);
			changed = true;
		}
	}

	function resizeCanvas() {
		var ratio = Math.max(window.devicePixelRatio || 1, 1);
		elCanvas.width = elCanvas.offsetWidth * ratio;
		elCanvas.height = elCanvas.offsetHeight * ratio;
		elCanvas.getContext('2d')?.scale(ratio, ratio);
	}

	function reset() {
		stamp = null;
		text = null;
		changed = false;
		redraw();
	}

	function redraw() {
		pad.clear();
		resizeCanvas();
		renderBackground();
		if (stamp) {
			renderImage(stamp);
		}
		if (text) {
			renderText(text);
		}
		renderLine();
	}

	export function getDimensions() {
		return {
			height: elCanvas.offsetHeight,
			width: elCanvas.offsetWidth
		};
	}

	export function toSVG() {
		return pad.toSVG();
	}

	export function toImage() {
		return pad.toDataURL('image/jpeg', 0.85);
	}
</script>

<div class="bg-base-200/50 rounded-sm flex flex-col {$$restProps.class || ''}">
	<div class="flex items-center gap-3 px-3 py-1 border-b border-base-300">
		<div class="grow truncate">
			{#if changed}
				<div class="flex items-center gap-3">
					<CheckIcon class="w-5 h-5 text-success" />
				</div>
			{:else}
				<div class="text-sm opacity-60 truncate">{$_('text.draw_your_signature')}</div>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				on:click|preventDefault={() => onTypeClick()}
				class="btn btn-sm btn-circle"
			>
				<FontIcon class="w-4 h-4" />
			</button>

			<button
				type="button"
				on:click|preventDefault={() => onUploadClick()}
				class="btn btn-sm btn-circle"
			>
				<StampIcon class="w-4 h-4" />
			</button>

			{#if changed}
				<button
					type="button"
					class="btn btn-sm btn-circle"
					on:click|preventDefault={() => onDownload()}
				>
					<DownloadIcon class="w-4 h-4" />
				</button>
			{/if}

			{#if changed}
				<button type="button" class="btn btn-sm btn-circle" on:click|preventDefault={() => reset()}>
					<DeleteBackIcon class="w-4 h-4" />
				</button>
			{/if}
		</div>
	</div>

	<div class="grow relative select-none rounded-b-md overflow-hidden">
		<canvas bind:this={elCanvas} class="w-full h-full"></canvas>

		{#if !changed}
			<div class="absolute left-4 bottom-8">
				<div
					class="flex flex-col gap-2 items-center bg-error text-error-content rounded-t-md w-8 h-20 py-2"
				>
					<SignatureIcon class="w-5 h-5 shrink-0" />
					<span class="rotate-90 text-xs whitespace-nowrap truncate mt-4">{$_('text.sign')}</span>
				</div>
				<div class="w-0 h-0 border-[1rem] border-transparent border-t-error"></div>
			</div>
		{/if}
	</div>
</div>
