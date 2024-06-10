<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { availableLocales } from '$lib/i18n';
	import Form from '$lib/components/Form.svelte';
	import Labels from '$lib/components/Labels.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import MultiSelectInput from '$lib/components/blocks/MultiSelectInput.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import MultiCheckboxInput from '$lib/components/blocks/MultiCheckboxInput.svelte';
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import { form } from '$lib/stores';
	import { clone } from '$lib/helpers';
	import type { PageData } from './$types';
	import UrlInput from '$lib/components/blocks/UrlInput.svelte';

	export let data: PageData;

	const badges = [
		{
			label: $_('badge.gdpr'),
			value: 'gdpr'
		},
		{
			label: $_('badge.ccpa'),
			value: 'ccpa'
		}
	];

	let changed: boolean = false;

	$: changed = JSON.stringify(data.form) !== JSON.stringify($form);
	$: fields = $form.steps.reduce(
		(acc, step) => {
			for (const block of step.blocks) {
				acc.push({
					label: block.label || block.name,
					value: block.name
				});
			}
			return acc;
		},
		[] as { label: string; value: string }[]
	);
	$: localeOptions = Object.entries(availableLocales).map(([value, label]) => ({ label, value }));

	function onReset() {
		if (changed && confirm($_('text.confirm_unsaved_changes'))) {
			$form = clone(data.form);
		}
	}
</script>

<Form action="?/updateForm" on:reset={() => onReset()} bind:changed let:error let:loading>
	<div class="flex flex-col gap-6">
		<div class="flex flex-col gap-6 max-w-md">
			<TextInput
				block={{
					label: $_('label.name'),
					help: $_('help.form_name'),
					name: 'name',
					required: true
				}}
				error={error?.fields?.name}
				bind:value={$form.name}
			/>

			<SelectInput
				block={{
					label: $_('label.status'),
					help: $_('help.form_status'),
					name: 'status',
					options: {
						options: [
							{
								label: $_('status.draft'),
								value: 'draft'
							},
							{
								label: $_('status.published'),
								value: 'published'
							},
							{
								label: $_('status.archived'),
								value: 'archived'
							}
						]
					},
					required: true
				}}
				error={error?.fields?.status}
				bind:value={$form.status}
			/>

			<SelectInput
				block={{
					label: $_('label.locale'),
					help: $_('help.form_locale'),
					name: 'locale',
					options: {
						options: localeOptions
					},
					required: true
				}}
				error={error?.fields?.locale}
				bind:value={$form.locale}
			/>

			<SelectInput
				block={{
					label: $_('label.presentation_mode'),
					help: $_('help.form_presentation_mode'),
					name: 'mode',
					options: {
						options: [
							{
								label: $_('label.mode_standard'),
								value: 'standard'
							},
							/*
							{
								label: $_('label.mode_guided'),
								value: 'guided'
							},
							*/
							{
								label: $_('label.mode_hidden'),
								value: 'hidden'
							}
						]
					},
					required: true
				}}
				error={error?.fields?.mode}
				bind:value={$form.mode}
			/>

			<MultiSelectInput
				block={{
					label: $_('label.response_display_blocks'),
					help: $_('help.response_display_blocks'),
					name: 'displayBlocks',
					options: {
						options: fields,
						maxItems: 3
					}
				}}
				bind:value={$form.displayBlocks}
			/>

			<BaseInput
				block={{
					label: $_('label.custom_labels'),
					help: $_('help.custom_labels'),
					name: 'labels'
				}}
			>
				<Labels bind:labels={$form.labels} on:change={() => (changed = true)} />

				<input type="hidden" name="labels" value={JSON.stringify($form.labels)} />
			</BaseInput>

			<TextInput
				block={{
					label: $_('label.submit_label'),
					help: $_('help.submit_label'),
					name: 'submitLabel'
				}}
				error={error?.fields?.submitLabel}
				bind:value={$form.submitLabel}
			/>
		</div>

		<div class="flex flex-col gap-6">
			<UrlInput
				block={{
					label: $_('label.success_redirect'),
					help: $_('help.success_redirect'),
					name: 'successRedirect'
				}}
				error={error?.fields?.successRedirect}
				bind:value={$form.successRedirect}
			/>

			<MultiLineTextInput
				block={{
					label: $_('label.success_text'),
					help: $_('help.success_text'),
					name: 'success'
				}}
				markdown
				error={error?.fields?.success}
				bind:value={$form.success}
			/>

			<MultiLineTextInput
				block={{
					label: $_('label.footer_text'),
					help: $_('help.footer_text'),
					name: 'footer'
				}}
				markdown
				bind:value={$form.footer}
			/>
		</div>

		<div class="flex flex-col gap-6 max-w-md">
			<ToggleInput
				block={{
					label: $_('label.show_confetti'),
					help: $_('help.show_confetti'),
					name: 'confetti'
				}}
				error={error?.fields?.confetti}
				bind:value={$form.confetti}
			/>

			<MultiCheckboxInput
				block={{
					label: $_('label.badges'),
					help: $_('help.form_badges'),
					name: 'badges',
					options: {
						inline: true,
						options: badges
					}
				}}
				bind:value={$form.badges}
			/>

			<ToggleInput
				block={{
					label: $_('label.hide_powered_by'),
					help: !data.licensed ? $_('help.feature_available_only_for_licensed_oss') : void 0,
					name: 'hidePoweredBy'
				}}
				disabled={!data.licensed}
				error={error?.fields?.hidePoweredBy}
				bind:value={$form.hidePoweredBy}
			/>
		</div>

		<StickyButtons disabled={!changed} {loading} />
	</div>
</Form>
