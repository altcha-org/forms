<script lang="ts">
	import AddressInput from '$lib/components/blocks/AddressInput.svelte';
	import CheckboxInput from '$lib/components/blocks/CheckboxInput.svelte';
	import DateTimeInput from '$lib/components/blocks/DateTimeInput.svelte';
	import DividerContent from '$lib/components/blocks/DividerContent.svelte';
	import EmailInput from '$lib/components/blocks/EmailInput.svelte';
	import FileInput from '$lib/components/blocks/FileInput.svelte';
	import ImageContent from '$lib/components/blocks/ImageContent.svelte';
	import ImageInput from '$lib/components/blocks/ImageInput.svelte';
	import MultiCheckboxInput from '$lib/components/blocks/MultiCheckboxInput.svelte';
	import MultiSelectInput from '$lib/components/blocks/MultiSelectInput.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import NumberInput from '$lib/components/blocks/NumberInput.svelte';
	import PdfInput from '$lib/components/blocks/PdfInput.svelte';
	import PhoneInput from '$lib/components/blocks/PhoneInput.svelte';
	import RadioInput from '$lib/components/blocks/RadioInput.svelte';
	import RatingInput from '$lib/components/blocks/RatingInput.svelte';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import SignatureInput from '$lib/components/blocks/SignatureInput.svelte';
	import TextContent from '$lib/components/blocks/TextContent.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import UrlInput from '$lib/components/blocks/UrlInput.svelte';
	import type { IForm, IFormBlock } from '$lib/types';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let block: IFormBlock<any>;
	export let disabled: boolean = false;
	export let encrypted: boolean = false;
	export let form: Pick<IForm, 'id' | 'locale' | 'steps'> | undefined = void 0;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | undefined = void 0;
	export let visible: boolean = true;

	let cmp: ReturnType<typeof getComponent>;

	$: cmp = getComponent(block.type);
	$: onTypeChange(block.type);
	$: props = {
		block,
		disabled,
		encrypted,
		form,
		preview,
		readonly,
		visible
	};

	function getComponent(type: string) {
		switch (type) {
			case 'AddressInput':
				return AddressInput;
			case 'CheckboxInput':
				return CheckboxInput;
			case 'DateTimeInput':
				return DateTimeInput;
			case 'DividerContent':
				return DividerContent;
			case 'EmailInput':
				return EmailInput;
			case 'FileInput':
				return FileInput;
			case 'ImageContent':
				return ImageContent;
			case 'ImageInput':
				return ImageInput;
			case 'MultiCheckboxInput':
				return MultiCheckboxInput;
			case 'MultiSelectInput':
				return MultiSelectInput;
			case 'MultiLineTextInput':
				return MultiLineTextInput;
			case 'NumberInput':
				return NumberInput;
			case 'PdfInput':
				return PdfInput;
			case 'PhoneInput':
				return PhoneInput;
			case 'RadioInput':
				return RadioInput;
			case 'RatingInput':
				return RatingInput;
			case 'SelectInput':
				return SelectInput;
			case 'SignatureInput':
				return SignatureInput;
			case 'TextContent':
				return TextContent;
			case 'TextInput':
				return TextInput;
			case 'ToggleInput':
				return ToggleInput;
			case 'UrlInput':
				return UrlInput;
			default:
				return TextInput;
		}
	}

	function onTypeChange(_: string) {
		if (preview) {
			value = void 0;
		}
	}
</script>

<svelte:component this={cmp} {...props} {...$$restProps} bind:value on:change></svelte:component>
