<script lang="ts">
	import { _ } from 'svelte-i18n';
	import slugify from 'slugify';
	import BLOCKS from '$lib/consts/blocks';
	import FormBlock from '$lib/components/blocks/FormBlock.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import InvisibleIcon from '$lib/components/icons/Invisible.svelte';
	import Alert from './Alert.svelte';
	import { form } from '$lib/stores';
	import type { IFormBlock } from '$lib/types';
	import SelectInput from './blocks/SelectInput.svelte';

	export let block: IFormBlock<Record<string, string | undefined>>;
	export let blockOriginal: IFormBlock;

	$: options = BLOCKS.find(({ type }) => type === block.type)?.options || [];
	$: isInput = block.type.endsWith('Input');
	$: isUniqueName =
		$form.steps.reduce((acc, step) => {
			return [...acc, ...step.blocks.filter((b) => b !== blockOriginal && b.name === block.name)];
		}, [] as IFormBlock[]).length === 0;
</script>

<div class="flex flex-wrap gap-6">
	<div class="flex-1">
		<div class="sticky top-24 flex flex-col gap-6">
			{#if isInput}
				<div class="flex flex-col gap-6">
					<div class="text-lg">{$_('label.general')}</div>

					{#if !isUniqueName}
						<Alert variant="warning">
							{$_('text.block_name_not_unique')}
						</Alert>
					{/if}

					<TextInput
						block={{
							label: $_('label.name'),
							help: $_('help.block_name'),
							name: 'name',
							required: true
						}}
						transform={(value) =>
							value
								? slugify(value, {
										lower: true,
										replacement: '_',
										trim: true
									})
								: value}
						bind:value={block.name}
					/>

					<TextInput
						block={{
							label: $_('label.label'),
							help: $_('help.block_label'),
							name: 'label',
							required: false
						}}
						bind:value={block.label}
					/>

					<ToggleInput
						block={{
							label: $_('label.required_field'),
							help: $_('help.block_required'),
							name: 'required',
							required: false
						}}
						bind:checked={block.required}
					/>
				</div>
			{/if}

			{#if options.length}
				<div class="flex flex-col gap-6">
					<div class="text-lg">{$_('label.options')}</div>

					{#each options as option}
						<FormBlock block={option} bind:value={block.options[option.name]} />
					{/each}
				</div>
			{/if}

			{#if isInput}
				<div class="flex flex-col gap-6">
					<div class="text-lg">{$_('label.visuals')}</div>

					<SelectInput
						block={{
							label: $_('label.size'),
							help: $_('help.block_size'),
							name: 'size',
							default: 'full',
							options: {
								options: [
									{
										label: $_('label.size_xs'),
										value: 'xs'
									},
									{
										label: $_('label.size_sm'),
										value: 'sm'
									},
									{
										label: $_('label.size_md'),
										value: 'md'
									},
									{
										label: $_('label.size_full'),
										value: 'full'
									}
								]
							},
							required: false
						}}
						bind:value={block.size}
					/>

					<TextInput
						block={{
							label: $_('label.help'),
							help: $_('help.block_help'),
							name: 'help',
							required: false
						}}
						bind:value={block.help}
					/>

					<TextInput
						block={{
							label: $_('label.placeholder'),
							help: $_('help.block_placeholder'),
							name: 'placeholder',
							required: false
						}}
						bind:value={block.placeholder}
					/>

					<TextInput
						block={{
							label: $_('label.default_value'),
							help: $_('help.block_default_value'),
							name: 'default',
							required: false
						}}
						bind:value={block.default}
					/>

					<ToggleInput
						block={{
							label: $_('label.readonly_field'),
							help: $_('help.block_readonly'),
							name: 'readonly',
							required: false
						}}
						bind:checked={block.readonly}
					/>

					<ToggleInput
						block={{
							label: $_('label.hidden_field'),
							help: $_('help.block_hidden'),
							name: 'hidden',
							required: false
						}}
						bind:checked={block.hidden}
					/>
				</div>
			{/if}

			<div class="flex flex-col gap-6">
				<div>
					<div class="text-lg">{$_('label.logic')}</div>
					<p class="">{$_('text.block_logic_info')}</p>
				</div>

				<TextInput
					block={{
						label: $_('label.expression'),
						help: $_('help.block_expression'),
						name: 'if',
						required: false
					}}
					bind:value={block.if}
				/>
			</div>
		</div>
	</div>

	<div class="w-full lg:w-5/12 lg:border-l border-base-300 lg:pl-6">
		<div class="sticky top-24">
			<div class="text-lg mb-6">{$_('label.preview')}</div>

			<div class="border border-dashed border-base-300 p-3 rounded-md">
				<div class="">
					{#if block.hidden}
						<div class="flex gap-3 items-center">
							<InvisibleIcon class="w-4 h-4 opacity-60" />
							<span>{$_('text.hidden_block')}</span>
						</div>
					{:else}
						<FormBlock {block} preview value={block.default} />
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
