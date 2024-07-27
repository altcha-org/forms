<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ArrowLeftIcon from '$lib/components/icons/ArrowLeft.svelte';
	import Altcha from '$lib/components/Altcha.svelte';
	import AltchaInvisible from '$lib/components/AltchaInvisible.svelte';
	import Form from '$lib/components/Form.svelte';
	import FormBlock from '$lib/components/blocks/FormBlock.svelte';
	import Steps from '$lib/components/Steps.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import ArrowRightIcon from '$lib/components/icons/ArrowRight.svelte';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import { getTimeZone, isMobile, shortenFormId } from '$lib/helpers';
	import { evalExpression } from '$lib/evaluator';
	import { Session } from '$lib/session';
	import type { IForm } from '$lib/types';

	export let analytics: boolean = false;
	export let encrypted: boolean = false;
	export let form: Pick<
		IForm,
		| 'captchaAuto'
		| 'captchaFloating'
		| 'captchaInvisible'
		| 'contextInfo'
		| 'hidePoweredBy'
		| 'id'
		| 'locale'
		| 'steps'
		| 'submitLabel'
	>;
	export let preview: boolean = false;

	const __context = form.contextInfo
		? new URLSearchParams({
				mobile: String(browser ? isMobile() : false),
				timezone: getTimeZone() || ''
			}).toString()
		: '';

	let activeStepIdx: number = 0;
	let session: Session | null = null;
	let browserLoaded: boolean = false;
	let cmpForm: Form;
	let __session: string = '';

	$: challengeurl = `/form/${shortenFormId(form.id)}/altcha`;
	$: hasNextStep = form.steps.length - 1 > activeStepIdx;
	$: hasPrevStep = activeStepIdx > 0;

	onDestroy(() => {
		if (session) {
			session.destroy();
		}
	});

	onMount(() => {
		if (browser) {
			browserLoaded = true;
			if (!preview && analytics) {
				session = new Session({
					form: cmpForm.getElement(),
					beaconUrl: `/form/${shortenFormId(form.id)}/beacon`
				});
			}
		}
	});

	function onBeforeSubmit() {
		if (session) {
			session.end();
			__session = session.dataToUrlString() || '';
		}
	}

	function onNext() {
		if (cmpForm.reportValidity()) {
			activeStepIdx = activeStepIdx + 1;
			scrollToTop();
		}
	}

	function onPrev() {
		activeStepIdx = activeStepIdx - 1;
		scrollToTop();
	}

	function onStep(idx: number) {
		if (idx < activeStepIdx || cmpForm.reportValidity()) {
			activeStepIdx = idx;
			scrollToTop();
		}
	}

	function scrollToTop() {
		requestAnimationFrame(() => {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		});
	}
</script>

<div class="flex flex-wrap gap-12 my-6 xl:my-12">
	<noscript>
		<div class="flex items-start gap-3">
			<div class="pt-1">
				<AlertIcon class="w-4 h-4" />
			</div>
			<div class="font-bold">
				{$_('text.requires_javascript')}
			</div>
		</div>
	</noscript>

	{#if form.steps.length > 1}
		<div class="w-48 hidden lg:flex">
			<div class="text-sm">
				<Steps activeStep={activeStepIdx} steps={form.steps} on:step={(ev) => onStep(ev.detail)} />
			</div>
		</div>
	{/if}

	<div class="flex-1 pt-4 max-w-full">
		<Form
			action={preview ? '' : `/form/${shortenFormId(form.id)}/submit_handle`}
			allowSubmit={!preview}
			data={{
				__context,
				__session
			}}
			successToast={false}
			bind:this={cmpForm}
			on:beforesubmit={onBeforeSubmit}
			let:formData
			let:loading
		>
			{#if form.steps.length === 0}
				<div>
					<p class="italic opacity-60">{$_('text.form_without_fields')}</p>
				</div>
			{/if}

			{#each form.steps as step, i}
				<div class="flex flex-col gap-6" class:hidden={activeStepIdx !== i}>
					{#if step.title || hasPrevStep}
						<div class="flex gap-2 min-h-8">
							{#if hasPrevStep}
								<button
									type="button"
									class="btn btn-sm btn-circle opacity-70 hover:opacity-100"
									on:click|preventDefault={() => onPrev()}
								>
									<ArrowLeftIcon class="w-4 h-4" />
								</button>
							{/if}
							<div class="flex-1">
								{#if step.title}
									<div class="text-xl font-bold">{step.title}</div>
								{/if}
							</div>
						</div>
					{/if}

					{#if step.text}
						<div class="flex-1">
							<div class="prose max-w-full">
								<MarkdownRenderer value={step.text} />
							</div>
						</div>
					{/if}

					{#each step.blocks as block}
						{@const show = !block.if || evalExpression(block.if, formData)}
						{#if show}
							<FormBlock
								{block}
								{encrypted}
								{form}
								{preview}
								readonly={loading}
								visible={activeStepIdx === i}
							/>
						{/if}
					{/each}

					{#if i === form.steps.length - 1 && !hasNextStep}
						{#if form.captchaInvisible}
							<AltchaInvisible {challengeurl} />
						{:else}
							<div class="flex flex-col gap-1">
								<div class="flex">
									<div class="bg-base-100 w-full max-w-[260px]">
										<Altcha
											auto={form.captchaAuto}
											floating={form.captchaFloating}
											hideBranding={form.hidePoweredBy}
											{challengeurl}
										/>
									</div>
								</div>
							</div>
						{/if}
					{/if}

					<div class="flex gap-3">
						{#if hasNextStep}
							<button
								type="button"
								class="btn btn-primary btn-wide gap-3"
								disabled={loading || !browserLoaded}
								on:click|preventDefault={() => onNext()}
							>
								<span class="grow">{$_('button.next')}</span>
								<ArrowRightIcon class="w-5 h-5" />
							</button>
						{:else}
							<button
								type={preview ? 'button' : 'submit'}
								class="btn btn-neutral btn-wide"
								disabled={loading || !browserLoaded}
							>
								<span class="grow">{form.submitLabel || $_('button.submit')}</span>
								{#if loading && !form.captchaFloating}
									<span class="loading loading-spinner loading-sm"></span>
								{:else}
									<CheckIcon class="w-5 h-5" />
								{/if}
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</Form>
	</div>
</div>
