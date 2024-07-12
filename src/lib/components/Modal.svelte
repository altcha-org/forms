<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Form from '$lib/components/Form.svelte';
	import CloseIcon from '$lib/components/icons/Close.svelte';

	export let action: string | undefined = void 0;
	export let autocomplete: string | undefined = void 0;
	export let buttonLabel: string = $_('button.save');
	export let cancelable: boolean = true;
	export let data: Record<string, any> | undefined = void 0;
	export let disabled: boolean = false;
	export let fullscreen: boolean = false;
	export let hideButton: boolean = false;
	export let large: boolean = false;
	export let medium: boolean = false;
	export let submitOnSave: boolean = true;
	export let open: boolean = false;
	export let padding: boolean = true;
	export let title: string;
	export let subtitle: string | undefined = void 0;
	export let successToast: string | false | undefined = void 0;

	const dispatch = createEventDispatcher();

	let elDialog: HTMLDialogElement;
	let form: Form;
	let loading: boolean = false;

	$: onOpenChange(open);

	onDestroy(() => {
		if (open) {
			open = false;
			dispatch('close');
		}
	});

	onMount(() => {
		if (open) {
			elDialog.showModal();
			dispatch('open');
		}
	});

	function onClose() {
		if (open) {
			open = false;
			dispatch('close');
		}
	}

	function onFormSubmit(ev: CustomEvent) {
		dispatch('submit', ev.detail);
		dispatch('close');
		open = false;
	}

	function onOpenChange(_: typeof open) {
		if (open && elDialog) {
			elDialog.showModal();
			dispatch('open');
		} else {
			elDialog?.close();
			dispatch('close');
			if (loading) {
				loading = false;
			}
		}
	}

	function onSave() {
		if (submitOnSave) {
			form?.requestSubmit();
		} else {
			dispatch('close');
			open = false;
		}
	}
</script>

<dialog bind:this={elDialog} class="modal" on:close={() => (open = false)}>
	<div
		class="modal-box flex flex-col p-0 rounded-none lg:rounded-2xl w-full h-full lg:h-auto max-h-full lg:max-h-[calc(100vh-5em)]"
		class:w-[92vw]={fullscreen}
		class:lg:max-w-[92vw]={fullscreen}
		class:h-[92vh]={fullscreen}
		class:xl:max-w-7xl={large}
		class:xl:w-full={large || medium}
		class:xl:h-lvh={large}
		class:xl:max-w-5xl={medium}
	>
		<div
			class="bg-base-100 border-b-2 border-base-300 sticky top-0 z-40 flex items-center gap-3 px-5 py-3"
		>
			<div class="flex-1 flex flex-col gap-1">
				<div class="text-lg font-light">{title}</div>
				{#if subtitle}
					<div class="text-sm opacity-60">{subtitle}</div>
				{/if}
			</div>

			<div>
				<button type="button" class="btn btn-sm btn-circle btn-ghost" on:click={() => onClose()}>
					<CloseIcon class="w-5 h-5" />
				</button>
			</div>
		</div>

		<div class="grow" data-modal-container class:p-5={padding}>
			<Form
				bind:this={form}
				bind:loading
				{action}
				{autocomplete}
				{data}
				{successToast}
				discardUnsaved
				on:submit={onFormSubmit}
				let:error
			>
				<slot {error} />
			</Form>
		</div>

		<div
			class="modal-action mt-0 justify-start sticky bottom-0 z-40 bg-base-200 border-t-2 border-base-300 px-5 py-3"
			class:justify-center={fullscreen}
		>
		 	<div class="grow flex gap-3">
				{#if !hideButton}
					<button
						type="button"
						class="btn btn-primary btn-wide"
						disabled={disabled || loading}
						on:click|preventDefault={() => onSave()}
					>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							{buttonLabel}
						{/if}
					</button>
				{/if}

				<slot name="actions_cancel" />

				{#if cancelable}
					<button type="button" class="btn btn-ghost opacity-60" on:click={() => onClose()}
						>{$_('button.cancel')}</button
					>
				{/if}
			</div>

			<slot name="actions" />
		</div>
	</div>
</dialog>
