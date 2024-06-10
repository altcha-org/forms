<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { _, locale } from 'svelte-i18n';
	import { page } from '$app/stores';
	import PremiumIcon from '$lib/components/icons/Premium.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import FormRenderer from '$lib/components/FormRenderer.svelte';
	import type { IForm, IFormTemplate } from '$lib/types';

	export let filter: string | undefined = void 0;
	export let templates: IFormTemplate[] = [];
	export let value: string | undefined = templates[0]?.id;

	const dispatch = createEventDispatcher();

	let loading: boolean = false;
	let previewForm: Pick<
		IForm,
		'captchaAuto' | 'captchaInvisible' | 'contextInfo' | 'id' | 'name' | 'steps' | 'submitLabel'
	> | null = null;
	let selectedCategory: string | null = null;

	$: accountIsPremium = $page.data.account?.plan?.premium === true;
	$: filteredTemplates = filterTemplates(templates, filter, selectedCategory);
	$: categories = templates
		.reduce((acc, { categories }) => {
			return categories ? [...new Set([...acc, ...categories])] : acc;
		}, [] as string[])
		.sort();

	onMount(() => {
		load();
	});

	async function load() {
		loading = true;
		try {
			const resp = await fetch($page.url.pathname + `/templates?locale=${$locale}`);
			const data = await resp.json();
			templates = (data?.templates || []).sort((a: IFormTemplate, b: IFormTemplate) => {
				if (a.premium && !b.premium) {
					return 1;
				}
				return (a.sort !== void 0 ? a.sort : 100) > (b.sort !== void 0 ? b.sort : 100) ? 1 : -1;
			});
			if (templates[0]?.id) {
				onSelect(templates[0]);
			}
		} finally {
			loading = false;
		}
	}

	function filterTemplates(_: typeof templates, __: typeof filter, ___: typeof selectedCategory) {
		if (filter) {
			const rx = new RegExp(filter, 'i');
			return templates.filter((template) => {
				return (
					(template.name && rx.test(template.name)) ||
					(template.description && rx.test(template.description))
				);
			});
		}
		if (selectedCategory) {
			return templates.filter(({ categories }) => categories?.includes(selectedCategory!));
		}
		return templates;
	}

	function onTemplateClick(ev: MouseEvent, template: IFormTemplate) {
		const target = ev.target as HTMLElement;
		if (!target?.matches('button')) {
			onSelect(template);
		}
	}

	function onPreview(template: IFormTemplate) {
		previewForm = {
			captchaAuto: false,
			captchaInvisible: true,
			contextInfo: false,
			submitLabel: null,
			id: '',
			name: template.name || '',
			steps: template.steps || []
		};
	}

	function onSelect(template: IFormTemplate) {
		value = template.id;
		dispatch('select', template);
	}
</script>

<div class="overflow-auto h-80 p-3">
	{#if categories.length}
		<div class="flex flex-wrap gap-2 mb-6">
			{#each categories as category}
				{@const count = templates.filter((tpl) => tpl.categories?.includes(category)).length}
				<button
					type="button"
					class="btn btn-sm font-normal"
					class:btn-primary={selectedCategory === category}
					on:click|preventDefault={() =>
						selectedCategory === category
							? (selectedCategory = null)
							: (selectedCategory = category)}
				>
					<span class="font-bold">{category}</span>
					<span class="opacity-60">({count})</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if !accountIsPremium}
		<div class="mb-6">
			<Alert variant="warning">
				{$_('text.upgrade_for_premium_templates')}

				<svelte:fragment slot="actions">
					<a href="/app/accounts/{$page.data.account.id}/billing" class="link"
						>{$_('button.upgrade')}</a
					>
				</svelte:fragment>
			</Alert>
		</div>
	{/if}

	<div class="grid xl:grid-cols-3 gap-x-6 gap-y-3 xl:gap-y-6">
		{#if filter && filteredTemplates.length === 0}
			<div class="italic opacity-60">
				{$_('text.no_results')}
			</div>
		{/if}

		{#each filteredTemplates as template}
			{@const enabled = !template.premium || accountIsPremium}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="flex flex-col w-full bg-base-100 border-2 rounded-md cursor-pointer"
				class:border-primary={value === template.id}
				on:click|preventDefault={(ev) => (enabled ? onTemplateClick(ev, template) : void 0)}
			>
				<div class="p-3 grow">
					<div class="flex gap-2 items-start font-bold mb-2">
						{#if template.premium && !enabled}
							<PremiumIcon class="w-4 h-4 text-warning mt-1" />
						{/if}
						<span>{template.name}</span>
					</div>

					{#if template.premium && !enabled}
						<div class="text-sm">{$_('text.premium_template')}</div>
					{/if}

					<div class="text-sm opacity-60">{template.description}</div>
				</div>
				<div class="flex items-center gap-2 px-3 py-2">
					{#if value === template.id}
						<div>
							<CheckIcon class="w-5 h-5 text-primary" />
						</div>
					{:else}
						<button
							type="button"
							class="btn btn-sm btn-primary"
							disabled={!enabled}
							on:click|preventDefault={() => onSelect(template)}
						>
							{$_('button.select')}
						</button>
					{/if}

					<button
						type="button"
						class="btn btn-sm btn-ghost"
						on:click|preventDefault={() => onPreview(template)}
					>
						{$_('button.preview')}
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if previewForm}
	<Modal
		action=""
		buttonLabel={$_('button.close')}
		cancelable={false}
		title={previewForm.name || ''}
		submitOnSave={false}
		medium
		open
		on:close={() => (previewForm = null)}
	>
		<div class="max-w-3xl mx-auto">
			<FormRenderer form={previewForm} preview />
		</div>
	</Modal>
{/if}
