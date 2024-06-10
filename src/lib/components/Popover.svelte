<script lang="ts">
	import {
		computePosition,
		autoUpdate,
		arrow as arrowMiddleware,
		flip,
		shift,
		size,
		offset as offsetMiddleware,
		type Placement
	} from '@floating-ui/dom';
	import { onDestroy, onMount } from 'svelte';

	export let delay: number = 300;
	export let disabled: boolean = false;
	export let dropdown: boolean = false;
	export let tooltip: string = '';
	export let placement: Placement | undefined = undefined;
	export let open: boolean | null = null;
	export let sameWidth: boolean = false;
	export let arrow: boolean = true;
	export let offset: number = 1;
	export let anchorToBody: boolean = false;

	let cleanup: (() => void) | undefined;
	let el: HTMLElement;
	let elArrow: HTMLElement;
	let elParent: HTMLElement;
	let elTooltip: HTMLElement;
	let mouseEnterTimeout: Timer | null = null;

	$: onOpenChange(open);

	onDestroy(() => {
		if (cleanup) {
			cleanup();
			cleanup = void 0;
		}
		if (el) {
			el.removeEventListener('blur', hide);
			el.removeEventListener('focus', show);
			el.removeEventListener('mouseenter', onMouseEnter);
			el.removeEventListener('mouseleave', onMouseLeave);
		}
	});

	onMount(() => {
		elParent = elTooltip.previousElementSibling as HTMLElement;
		el = elParent.querySelector('[data-popover-input]') || elParent;
		el.addEventListener('blur', hide);
		el.addEventListener('focus', show);
		if (open === null) {
			if (!dropdown) {
				el.addEventListener('mouseenter', onMouseEnter);
				el.addEventListener('mouseleave', onMouseLeave);
			}
		}
		if (anchorToBody) {
			document.body.appendChild(elTooltip);
		}
		cleanup = autoUpdate(el, elTooltip, () => {
			computePosition(elParent, elTooltip, {
				middleware: [
					flip(),
					shift(),
					offsetMiddleware(offset),
					arrowMiddleware({
						element: elArrow
					}),
					size({
						apply({ availableHeight, rects }) {
							if (elTooltip) {
								Object.assign(elTooltip.style, {
									maxHeight: `${availableHeight}px`,
									width: sameWidth ? `${rects.reference.width}px` : void 0
								});
							}
						}
					})
				],
				placement
			}).then(({ x, y, placement, middlewareData }) => {
				if (elTooltip) {
					Object.assign(elTooltip.style, {
						left: `${x}px`,
						top: `${y}px`
					});
				}
				if (elArrow) {
					const { x: arrowX, y: arrowY } = middlewareData.arrow!;
					const staticSide = {
						top: 'bottom',
						right: 'left',
						bottom: 'top',
						left: 'right'
					}[placement.split('-')[0]];
					Object.assign(elArrow.style, {
						left: arrowX != null ? `${arrowX}px` : '',
						top: arrowY != null ? `${arrowY}px` : '',
						right: '',
						bottom: '',
						[staticSide!]: '-4px'
					});
				}
			});
		});
	});

	function onMouseEnter() {
		if (mouseEnterTimeout) {
			clearTimeout(mouseEnterTimeout);
		}
		mouseEnterTimeout = setTimeout(() => {
			mouseEnterTimeout = null;
			show();
		}, delay);
	}

	function onMouseLeave() {
		if (mouseEnterTimeout) {
			clearTimeout(mouseEnterTimeout);
			mouseEnterTimeout = null;
		}
		hide();
	}

	function onOpenChange(_: typeof open) {
		if (open) {
			show();
		} else {
			hide();
		}
	}

	export function hide() {
		if (elTooltip && !disabled) {
			// allow click events from the menu to bubble up
			setTimeout(() => {
				elTooltip?.classList.remove('popover-open');
				if (open !== false) {
					open = false;
				}
			}, 100);
		}
	}

	export function show() {
		if (elTooltip && !disabled) {
			setTimeout(() => {
				elTooltip?.classList.add('popover-open');
				if (open !== true) {
					open = true;
				}
			}, 50);
		}
	}
</script>

<slot {disabled} />

<div
	class="popover {$$restProps.class || ''}"
	class:popover-dropdown={dropdown}
	bind:this={elTooltip}
	role="tooltip"
>
	{#if $$slots.content}
		<slot name="content" />
	{:else if tooltip}
		<div class="p-2 text-sm">{tooltip}</div>
	{/if}
	{#if arrow}
		<div class="popover-arrow" bind:this={elArrow}></div>
	{/if}
</div>
