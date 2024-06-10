<script lang="ts">
	import { _ } from 'svelte-i18n';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import MultiLineTextInput from '$lib/components/blocks/MultiLineTextInput.svelte';
	import FormBlocksList from '$lib/components/FormBlocksList.svelte';
	import type { IFormStep } from '$lib/types';

	export let step: IFormStep;

	$: showTextInput = step.text !== void 0;
</script>

<div class="flex">
	<div class="flex-1 flex flex-col gap-6">
		<div>
			<TextInput
				block={{
					label: $_('label.title'),
					name: '',
					required: false,
					type: 'TextInput'
				}}
				bind:value={step.title}
			/>
		</div>

		{#if showTextInput}
			<div>
				<MultiLineTextInput
					markdown
					block={{
						label: $_('label.text'),
						name: '',
						required: false,
						type: 'MultiLineTextInput'
					}}
					bind:value={step.text}
				/>
			</div>
		{/if}

		<div>
			<div class="font-bold mb-2">{$_('label.blocks')}</div>
			<FormBlocksList bind:blocks={step.blocks} />
		</div>
	</div>
</div>
