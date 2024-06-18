<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Form from '$lib/components/Form.svelte';
	import FormStep from '$lib/components/FormStep.svelte';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import StickyButtons from '$lib/components/StickyButtons.svelte';
	import Tabs from '$lib/components/Tabs.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import UploadIcon from '$lib/components/icons/Upload.svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import MoreIcon from '$lib/components/icons/More.svelte';
	import AddImageIcon from '$lib/components/icons/AddImage.svelte';
	import FontIcon from '$lib/components/icons/Font.svelte';
	import { form } from '$lib/stores';
	import { clone } from '$lib/helpers';
	import type { PageData } from './$types';
	import type { IFormStep } from '$lib/types';

	export let data: PageData;

	let activeStepIdx: number = 0;
	let bannerPreviewUrl: string | undefined = void 0;
	let logoPreviewUrl: string | undefined = void 0;
	let uploadBanner: boolean = !!$form.banner || !!$form.logo;

	$: step = $form.steps[activeStepIdx];
	$: changed = JSON.stringify(data.form) !== JSON.stringify($form);

	function onAddStep() {
		$form.steps.push({
			blocks: [],
			title: ''
		});
		$form = $form;
	}

	function onAddText() {
		if (step.text === void 0) {
			step.text = '';
		}
	}

	function onRemoveBanner() {
		if (confirm($_('text.confirm_remove_image'))) {
			$form.banner = '';
			bannerPreviewUrl = void 0;
		}
	}

	function onRemoveLogo() {
		if (confirm($_('text.confirm_remove_image'))) {
			$form.logo = '';
			logoPreviewUrl = void 0;
		}
	}

	function onReset() {
		if (changed && confirm($_('text.confirm_unsaved_changes'))) {
			$form = clone(data.form);
		}
	}

	function onStepRemove(step: IFormStep) {
		if (
			confirm(
				$_('text.confirm_remove', {
					values: {
						name:
							step.title || $_('label.nth_step', { values: { n: $form.steps.indexOf(step) + 1 } })
					}
				})
			)
		) {
			activeStepIdx = Math.max(0, $form.steps.indexOf(step) - 1);
			$form.steps = $form.steps.filter((s) => s !== step);
		}
	}
</script>

<Form
	action="?/updateForm"
	data={{
		banner: $form.banner,
		logo: $form.logo,
		steps: JSON.stringify($form.steps)
	}}
	on:reset={() => onReset()}
	let:changed={formChanged}
	let:loading
>
	<div class="flex flex-col gap-12">
		{#if uploadBanner}
			<div
				class="bg-base-200/30 border-dashed border-base-content/20 rounded-b-3xl relative h-40 lg:h-56 mb-3"
				class:border={!$form.banner && !bannerPreviewUrl}
			>
				<div class="absolute right-4 bottom-4">
					<ImageUpload
						name="banner"
						submitUrl={`/app/forms/${$form.id}/file`}
						bind:value={$form.banner}
						on:preview={(ev) => (bannerPreviewUrl = ev.detail.url)}
						let:error
					>
						<div
							class="flex flex-col items-center justify-center gap-1 w-44 lg:w-60 h-28 cursor-pointer"
						>
							<div>
								<UploadIcon class="w-6 h-6 opacity-40" />
							</div>
							{#if error}
								<div class="text-error">{error}</div>
							{:else}
								<div>{$_('placeholder.upload_banner')}</div>
								<div class="text-xs opacity-60">872x224</div>
							{/if}
						</div>
					</ImageUpload>
				</div>

				{#if $form.banner || bannerPreviewUrl}
					<div class="absolute inset-0 rounded-b-3xl bg-base-100 overflow-hidden">
						<img
							src={bannerPreviewUrl || `/storage/${$form.banner}`}
							alt=""
							class="w-full h-full object-cover"
						/>
					</div>
				{/if}

				<div
					class="absolute left-3 lg:left-6 -bottom-4 w-32 h-32 lg:w-44 lg:h-44 bg-base-100 border-dashed border-base-content/20 rounded-lg overflow-hidden"
					class:border={!$form.logo && !logoPreviewUrl}
				>
					<div class="max-w-full">
						<ImageUpload
							name="logo"
							submitUrl={`/app/forms/${$form.id}/file`}
							bind:value={$form.logo}
							on:preview={(ev) => (logoPreviewUrl = ev.detail.url)}
							let:error
						>
							<div
								class="flex flex-col items-center justify-center gap-1 w-32 h-32 lg:w-44 lg:h-44 cursor-pointer"
							>
								<div>
									<UploadIcon class="w-6 h-6 opacity-40" />
								</div>
								{#if error}
									<div class="text-error">{error}</div>
								{:else}
									<div>{$_('placeholder.upload_logo')}</div>
									<div class="text-xs opacity-60">176x176</div>
								{/if}
							</div>
						</ImageUpload>

						{#if $form.logo || logoPreviewUrl}
							<div class="absolute inset-0 bg-base-100 overflow-hidden">
								<img
									src={logoPreviewUrl || `/storage/${$form.logo}`}
									alt=""
									class="w-full h-full object-cover"
								/>
							</div>

							<div class="absolute top-2 right-2">
								<button type="button" class="btn btn-sm btn-circle" on:click={() => onRemoveLogo()}>
									<DeleteBackIcon class="w-4 h-4" />
								</button>
							</div>
						{/if}
					</div>
				</div>

				{#if $form.banner || bannerPreviewUrl}
					<div class="absolute top-2 right-2">
						<button type="button" class="btn btn-sm btn-circle" on:click={() => onRemoveBanner()}>
							<DeleteBackIcon class="w-4 h-4" />
						</button>
					</div>
				{/if}
			</div>
		{/if}

		<div class="flex flex-col gap-3">
			<div class="flex items-start gap-3 border-b-2 border-base-200 min-h-10">
				<Tabs
					tabs={$form.steps.map((step, i) => ({
						label: step.title
							? `${i + 1}. ${step.title}`
							: $_('label.nth_step', { values: { n: i + 1 } })
					}))}
					class="relative w-full mb-[-2px] !px-0"
					bind:activeIndex={activeStepIdx}
				/>

				<div class="flex gap-2">
					<button
						type="button"
						class="btn btn-sm gap-1 flex-nowrap"
						class:btn-primary={$form.steps.length === 0}
						on:click|preventDefault={() => onAddStep()}
					>
						<PlusIcon class="w-4 h-4" />
						<span class="whitespace-nowrap hidden lg:inline">{$_('button.add_step')}</span>
					</button>

					<div class="dropdown dropdown-end">
						<div tabindex="0" role="button" class="btn btn-sm btn-square">
							<MoreIcon class="w-4 h-4" />
						</div>
						<DropdownMenu autoclose>
							<ul class="menu gap-1">
								<li class="menu-title">{$_('label.actions')}</li>
								<li>
									<button
										type="button"
										class="grow flex"
										on:click|preventDefault={() => onStepRemove(step)}
									>
										<span class="grow">{$_('button.remove_this_step')}</span>
										<DeleteBackIcon class="w-4 h-4" />
									</button>
								</li>
								<li>
									<button
										type="button"
										class="grow flex"
										on:click|preventDefault={() => (uploadBanner = !uploadBanner)}
									>
										<span class="grow">{$_('button.add_banner_or_logo')}</span>
										<AddImageIcon class="w-4 h-4" />
									</button>
								</li>
								<li>
									<button
										type="button"
										class="grow flex"
										on:click|preventDefault={() => onAddText()}
									>
										<span class="grow">{$_('button.add_text')}</span>
										<FontIcon class="w-4 h-4" />
									</button>
								</li>
							</ul>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-6">
			{#if $form.steps.length === 0}
				<div>
					<div class="opacity-60 italic">{$_('text.no_steps')}</div>
				</div>
			{/if}

			{#if step}
				<FormStep bind:step on:remove={() => onStepRemove(step)} />
			{/if}
		</div>

		<StickyButtons disabled={!changed && !formChanged} />
	</div>
</Form>
