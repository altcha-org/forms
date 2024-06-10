<script lang="ts">
	import { _ } from 'svelte-i18n';
	import FormDataRendererItem from '$lib/components/FormDataRendererItem.svelte';
	import List from '$lib/components/List.svelte';
	import type { IFileWithoutAccount, IForm, TResponseData } from '$lib/types';

	export let data: TResponseData;
	export let files: Promise<IFileWithoutAccount[]>;
	export let form: Partial<IForm>;

	$: steps =
		form.steps?.map((step) => {
			return {
				blocks: step.blocks.map((block) => {
					const field = data[block.name];
					return {
						block,
						field
					};
				}),
				title: step.title
			};
		}) || [];
	$: extraFields = Object.keys(data).filter(
		(name) => !steps.some(({ blocks }) => blocks.some((block) => block.block.name === name))
	);
</script>

<div class="flex flex-col gap-3">
	{#each steps as { blocks, title }}
		<div class="flex flex-col gap-2">
			{#if title}
				<div class="text-lg">{title}</div>
			{/if}

			<List items={blocks} let:item>
				<FormDataRendererItem block={item.block} value={item.field} {files} on:edit />
			</List>
		</div>
	{/each}

	{#if extraFields.length}
		<div class="flex flex-col gap-2">
			<div class="text-lg">{$_('label.extra_fields')}</div>

			<List items={extraFields} let:item>
				<FormDataRendererItem
					block={{
						name: item,
						options: {},
						type: 'MultiLineTextInput'
					}}
					value={data[item]}
					{files}
					on:edit
				/>
			</List>
		</div>
	{/if}
</div>
