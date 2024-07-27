<script lang="ts">
	import { _ } from 'svelte-i18n';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import Popover from '$lib/components/Popover.svelte';
	import PHONE_CODES from '$lib/phone-codes';
	import { debounce } from '$lib/helpers';
	import type { IFormBlockPartial } from '$lib/types';

	interface ISuggestion {
		address: {
			amenity?: string;
			county: string;
			country: string;
			country_code: string;
			city: string;
			house_number: string;
			office?: string;
			postcode: string;
			road: string;
			shop?: string;
			state: string;
			state_district?: string;
		};
		class: string;
		display_name: string;
		name: string;
		place_id: number;
		type: string;
	}

	export let block: IFormBlockPartial<{
		allowedCountries?: string;
	}>;
	export let error: string | undefined = void 0;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | null | undefined = void 0;
	export let visible: boolean = true;

	const _onAddressLineChange = debounce(onAddressLineChange, 500);

	let popoverOpen: boolean = false;
	let addressLine1: string = '';
	let addressLine2: string = '';
	let city: string = '';
	let county: string = '';
	let country: string = '';
	let elInput: HTMLInputElement;
	let loading: boolean = false;
	let postalCode: string = '';
	let suggestions: ISuggestion[] = [];

	$: allowedCountries = block.options?.allowedCountries
		?.split(/\r?\n|[,;]/)
		.filter((item: string) => !!item)
		.map((item: string) => item.trim().toLowerCase());
	$: countries = (
		allowedCountries?.length
			? PHONE_CODES.filter(
					({ code, dial_code }) =>
						allowedCountries.includes(code.toLowerCase()) || allowedCountries.includes(dial_code)
				)
			: PHONE_CODES
	).sort((a, b) => a.code.localeCompare(b.code));
	$: countryName = PHONE_CODES.find(({ code }) => code.toLowerCase() === country)?.name;
	$: required = visible && !preview && block.required;
	$: onAddressChange(addressLine1, addressLine2, city, county, postalCode, country);
	$: _onAddressLineChange(addressLine1);

	function getAddressLine(suggestion: ISuggestion) {
		return [suggestion.address.road || '', suggestion.address.house_number || '']
			.filter((p) => !!p)
			.join(' ');
	}

	function onAddressChange(
		_addressLine1: typeof addressLine1,
		_addressLine2: typeof addressLine2,
		_city: typeof city,
		_county: typeof county,
		_postalCode: typeof postalCode,
		_country: typeof country
	) {
		if (addressLine1 && country) {
			value = serializeAddress();
		} else {
			value = null;
		}
	}

	function onAddressLineChange(_: typeof addressLine1) {
		if (addressLine1) {
			search(addressLine1).then((result) => {
				suggestions = result ? result.slice(0, 4) : [];
				if (suggestions.length && elInput === document.activeElement && !popoverOpen) {
					popoverOpen = true;
				}
			});
		} else {
			suggestions = [];
		}
	}

	function onSetSuggestion(suggestion: ISuggestion) {
		const office =
			suggestion.address.office || suggestion.address.amenity || suggestion.address.shop;
		if (office) {
			addressLine1 = office;
			addressLine2 = getAddressLine(suggestion);
		} else {
			addressLine1 = getAddressLine(suggestion);
			addressLine2 = '';
		}
		city = suggestion.address.city;
		county =
			suggestion.address.state_district || suggestion.address.state || suggestion.address.county;
		postalCode = suggestion.address.postcode;
		country = suggestion.address.country_code.toLowerCase();
		if (popoverOpen) {
			popoverOpen = false;
		}
	}

	function serializeAddress() {
		return [
			addressLine1,
			addressLine2,
			[city, postalCode].filter((p) => !!p).join(', '),
			county,
			countryName || country
		]
			.filter((p) => !!p)
			.join('\n');
	}

	async function search(q: string) {
		const url = new URL('https://nominatim.openstreetmap.org/search');
		url.searchParams.set('q', q);
		url.searchParams.set('format', 'json');
		url.searchParams.set('addressdetails', '1');
		loading = true;
		try {
			const resp = await fetch(url);
			if (resp.status !== 200) {
				return null;
			}
			const json = await resp.json();
			if (!Array.isArray(json)) {
				return null;
			}
			return json;
		} catch {
			return null;
		} finally {
			loading = false;
		}
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<input type="hidden" name={block.name} {value} />

	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-1">
			<div class="text-sm">{$_('label.address_line_1')}</div>
			<Popover dropdown sameWidth bind:open={popoverOpen}>
				<input
					bind:this={elInput}
					type="text"
					autocomplete="street-address"
					placeholder={block.placeholder}
					readonly={readonly || block.readonly}
					{required}
					class="input input-bordered shadow-sm w-full"
					data-popover-input
					bind:value={addressLine1}
				/>

				<div slot="content">
					<ul class="menu gap-1 p-1">
						{#if suggestions.length === 0}
							<li class="menu-title font-normal">
								<div class="opacity-60">{$_('text.no_suggestions')}</div>
							</li>
						{/if}

						{#each suggestions as suggestion}
							<li>
								<button type="button" on:click|preventDefault={() => onSetSuggestion(suggestion)}>
									<span>{suggestion.display_name}</span>
								</button>
							</li>
						{/each}

						<li>
							<div class="opacity-60">
								{#if loading}
									<span class="loading loading-spinner loading-xs"></span>
								{/if}
								<a href="https://www.openstreetmap.org" class="text-xs" target="_blank"
									>Powered by <span class="link">OpenStreetMap</span></a
								>
							</div>
						</li>
					</ul>
				</div>
			</Popover>
		</div>

		<div class="flex flex-col gap-1">
			<div class="text-sm">{$_('label.address_line_2')}</div>
			<div>
				<input
					type="text"
					class="input input-bordered shadow-sm w-full"
					readonly={readonly || block.readonly}
					bind:value={addressLine2}
				/>
			</div>
		</div>

		<div class="flex flex-wrap gap-6">
			<div class="grow flex flex-col gap-1 w-full md:w-auto">
				<div class="text-sm">{$_('label.city')}</div>
				<div>
					<input
						type="text"
						class="input input-bordered shadow-sm w-full"
						readonly={readonly || block.readonly}
						bind:value={city}
					/>
				</div>
			</div>

			<div class="grow flex flex-col gap-1">
				<div class="text-sm">{$_('label.county_or_region')}</div>
				<div>
					<input
						type="text"
						class="input input-bordered shadow-sm w-full"
						readonly={readonly || block.readonly}
						bind:value={county}
					/>
				</div>
			</div>

			<div class="grow flex flex-col gap-1">
				<div class="text-sm">{$_('label.postal_code')}</div>
				<div>
					<input
						type="text"
						autocomplete="postal-code"
						class="input input-bordered shadow-sm w-full"
						readonly={readonly || block.readonly}
						bind:value={postalCode}
					/>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-1 max-w-sm">
			<div class="text-sm">{$_('label.country')}</div>
			<div>
				<select
					autocomplete="country"
					class="select select-bordered w-full"
					{required}
					bind:value={country}
				>
					<option value={void 0} disabled selected>{$_('placeholder.select_country')}</option>
					{#each countries as item}
						<option value={item.code.toLowerCase()}>{item.name} {item.emoji} ({item.code})</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</BaseInput>
