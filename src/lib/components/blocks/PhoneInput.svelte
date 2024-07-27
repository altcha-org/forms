<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import PHONE_CODES from '$lib/phone-codes';
	import { getTimeZone, timeZoneToCountryCode } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		allowedCountries: string;
	}>;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | null = block.default || null;
	export let visible: boolean = true;

	const NUMBER_REGEXP = /[^\d]/g;

	let country: string | undefined = void 0;
	let countryCode: string | undefined = void 0;
	let phone: string = '';

	$: allowedCountries = block.options?.allowedCountries
		?.split(/\r?\n|[,;]/)
		.filter((item: string) => !!item)
		.map((item: string) => item.trim().toLowerCase());
	$: phoneCodes = (
		allowedCountries?.length
			? PHONE_CODES.filter(
					({ code, dial_code }) =>
						allowedCountries.includes(code.toLowerCase()) || allowedCountries.includes(dial_code)
				)
			: PHONE_CODES
	).sort((a, b) => a.code.localeCompare(b.code));
	$: countryCode = PHONE_CODES.find(({ code }) => code.toLowerCase() === country)?.dial_code;
	$: required = visible && !preview && block.required;

	onMount(() => {
		country = timeZoneToCountryCode(getTimeZone());
	});

	function onChange() {
		if (NUMBER_REGEXP.test(phone)) {
			phone = phone.replace(NUMBER_REGEXP, '');
		}
		if (phone) {
			value = [countryCode || '', phone].join('');
		}
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<input type="hidden" name={block.name} {value} />

	<div class="join join-vertical shadow-sm">
		<select
			autocomplete="tel-country-code"
			class="select select-bordered join-item {country === void 0 ? 'text-base-content/50' : ''}"
			disabled={block.readonly}
			bind:value={country}
			on:change={onChange}
		>
			<option value={void 0} disabled selected>{$_('placeholder.select_country')}</option>
			{#each phoneCodes as item}
				<option value={item.code.toLowerCase()}>
					{item.name}
					{item.emoji} ({item.code}
					{item.dial_code})
				</option>
			{/each}
		</select>
		<label class="input input-bordered join-item flex items-center gap-2">
			{#if countryCode}
				<span class="border-r border-base-content/20 pr-2">{countryCode}</span>
			{/if}
			<input
				type="tel"
				class="grow"
				inputmode="numeric"
				autocomplete="tel-national"
				maxlength="15"
				pattern={'[0-9]{5,15}'}
				placeholder={block.placeholder}
				readonly={readonly || block.readonly}
				{required}
				bind:value={phone}
				on:change={onChange}
			/>
		</label>
	</div>
</BaseInput>
