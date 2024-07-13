<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll, beforeNavigate } from '$app/navigation';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface IFormError {
		error: string;
		fields?: Record<string, string>;
	}

	export let action: string | undefined = void 0;
	export let autocomplete: string | undefined = void 0;
	export let beforeSubmit: (() => boolean) | undefined = void 0;
	export let confirmText: string | undefined = void 0;
	export let changed: boolean = false;
	export let data: Record<string, unknown> | undefined = void 0;
	export let discardUnsaved: boolean = false;
	export let loading: boolean = false;
	export let invalidateOnSubmit: boolean = true;
	export let method: 'get' | 'post' = 'post';
	export let resetOnSubmit: boolean = false;
	export let successToast: string | false | undefined = void 0;

	const dispatch = createEventDispatcher();

	let elForm: HTMLFormElement;
	let error: IFormError | undefined;
	let formData: Record<string, unknown> = {};

	beforeNavigate(({ cancel }) => {
		if (changed && !discardUnsaved) {
			const ok = confirm($_('text.confirm_unsaved_changes'));
			if (ok) {
				dispatch('reset');
			} else {
				cancel();
			}
		}
	});

	const enhanceFunc: SubmitFunction = ({ cancel }) => {
		if (action === '') {
			cancel();
			dispatch('submit', { data: getData() });
			changed = false;
			return void 0;
		}
		if (confirmText && !confirm(confirmText)) {
			cancel();
			return void 0;
		}
		if (beforeSubmit && beforeSubmit() === false) {
			cancel();
			return void 0;
		}
		error = void 0;
		if (!loading) {
			loading = true;
		}
		return async ({ result }) => {
			changed = false;
			try {
				const isSuccess = ['success', 'redirect'].includes(result.type);
				if (isSuccess) {
					if (resetOnSubmit && elForm) {
						elForm.reset();
					}
					if (successToast !== false) {
						toast.success(successToast || $_('notification.success'));
					}
					if (invalidateOnSubmit) {
						await invalidateAll();
					}
					dispatch('submit', { data: getData(), result });
				} else {
					console.error(result);
					if ('data' in result && typeof result.data === 'object') {
						error = result.data as IFormError;
					} else if ('message' in result && typeof result.message === 'string') {
						error = { error: result.message };
					} else {
						error = { error: 'Server error' };
					}
					dispatch('error', { error });
				}
				// calling update() resets the input values -> call  applyAction() instead
				// await update();
				await applyAction(result);
			} finally {
				loading = false;
			}
		};
	};

	function onBeforeUnload(ev: Event) {
		if (changed && !discardUnsaved) {
			ev.preventDefault();
			return $_('text.confirm_unsaved_changes');
		}
	}

	function onChange() {
		if (!changed) {
			changed = true;
		}
		formData = Object.fromEntries(getData());
	}

	function onError(ev: Event | CustomEvent) {
		if ('detail' in ev) {
			error = {
				error: ev.detail?.message
			};
		}
		if (loading) {
			loading = false;
		}
	}

	function onReset() {
		dispatch('reset');
		if (changed) {
			changed = false;
		}
	}

	function onSubmit() {
		loading = true;
		dispatch('beforesubmit');
	}

	export function getElement() {
		return elForm;
	}

	export function getData() {
		return elForm ? new FormData(elForm) : new FormData();
	}

	export function requestSubmit() {
		elForm?.requestSubmit();
	}

	export function reportValidity() {
		return elForm?.reportValidity();
	}

	export function checkValidity() {
		return elForm?.checkValidity();
	}
</script>

<svelte:window on:beforeunload={onBeforeUnload} />

<form
	bind:this={elForm}
	use:enhance={enhanceFunc}
	on:change={onChange}
	on:error={onError}
	on:submit|capture={onSubmit}
	on:reset|preventDefault={onReset}
	{action}
	{autocomplete}
	{method}
	{...$$restProps}
>
	{#if error}
		<div role="alert" class="flex items-center gap-3 rounded-md bg-error/10 border-error p-3 mb-6">
			<AlertIcon class="w-6 h-6 text-error" />
			<span>{error?.error}</span>
		</div>
	{/if}

	{#if data}
		{#each Object.entries(data) as [k, v]}
			<input type="hidden" name={k} value={v} />
		{/each}
	{/if}

	<slot {changed} {formData} {error} {loading} />
</form>
