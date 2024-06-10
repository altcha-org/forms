<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher, onMount } from 'svelte';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import ReloadIcon from '$lib/components/icons/Reload.svelte';
	import ClipboardIcon from '$lib/components/icons/Clipboard.svelte';
	import InvisibleIcon from '$lib/components/icons/Invisible.svelte';
	import VisibleIcon from '$lib/components/icons/Visible.svelte';
	import { copyToClipboard, randomInt, generatePassword } from '$lib/helpers';
	import bubble from '$lib/bubble';
	import type { IFormBlockPartial } from '$lib/types';

	export let autocomplete: string | undefined = void 0;
	export let block: IFormBlockPartial;
	export let copy: boolean = false;
	export let disabled: boolean = false;
	export let error: string | undefined = void 0;
	export let generate: 'password' | 'token' | false = false;
	export let generateOnMount: boolean = false;
	export let value: string | null | undefined = block.default;

	const dispatch = createEventDispatcher();

	let visible: boolean = false;

	$: maxLength = block.options?.maxLength;
	$: minLength = block.options?.minLength;
	$: value === void 0 ? (value = block.default) : void 0;

	onMount(() => {
		if (generateOnMount && !value && generate) {
			generateNewPassword();
		}
	});

	function generateNewPassword() {
		if (value && !confirm($_('text.confirm_regenerate'))) {
			return;
		}
		visible = true;
		if (generate === 'password') {
			value = generatePassword(14 + randomInt(0, 4), [
				/[a-zA-Z]/,
				/[a-zA-Z0-9]/,
				/\d/,
				/[a-zA-Z0-9]/,
				/[\#\%\&\+\.]/,
				/[a-zA-Z0-9\#\%\&\+\.]/
			]);
		} else if (generate === 'token') {
			value = generatePassword(24, [/[a-f0-9]/]);
		}
		dispatch('generate', value);
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<label class="input input-bordered shadow-sm flex items-center pr-2" class:disabled>
		{#if visible}
			<input
				type="text"
				maxlength={maxLength}
				minlength={minLength}
				name={block.name}
				placeholder={block.placeholder}
				readonly={block.readonly}
				required={block.required}
				class="grow"
				{autocomplete}
				{disabled}
				bind:value
			/>
		{:else}
			<input
				type="password"
				maxlength={maxLength}
				minlength={minLength}
				name={block.name}
				placeholder={block.placeholder}
				readonly={block.readonly}
				required={block.required}
				class="grow"
				{autocomplete}
				{disabled}
				bind:value
			/>
		{/if}

		{#if generate}
			<div class="tooltip tooltip-left" data-tip={$_('tooltip.generate_password')}>
				<button
					type="button"
					class="btn btn-sm btn-circle btn-ghost opacity-60 hover:opacity-100"
					on:click|preventDefault={() => generateNewPassword()}
				>
					<ReloadIcon class="w-4 h-4" />
				</button>
			</div>
		{/if}

		{#if copy}
			<div class="tooltip tooltip-left" data-tip={$_('tooltip.copy_to_clipboard')}>
				<button
					type="button"
					class="btn btn-sm btn-circle btn-ghost opacity-60 hover:opacity-100"
					use:bubble={{ handler: () => copyToClipboard(value || ''), text: $_('text.copied') }}
				>
					<ClipboardIcon class="w-4 h-4" />
				</button>
			</div>
		{/if}

		<div class="tooltip tooltip-left" data-tip={$_('tooltip.toggle_visibility')}>
			<button
				type="button"
				class="btn btn-sm btn-circle btn-ghost opacity-60 hover:opacity-100"
				on:click|preventDefault={() => (visible = !visible)}
			>
				{#if !visible}
					<InvisibleIcon class="w-4 h-4" />
				{:else}
					<VisibleIcon class="w-4 h-4" />
				{/if}
			</button>
		</div>
	</label>
</BaseInput>
