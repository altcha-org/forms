<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Altcha from '$lib/components/Altcha.svelte';
	import AltchaInvisible from '$lib/components/AltchaInvisible.svelte';
	import Form from '$lib/components/Form.svelte';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import { shortenFormId } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	let loading: boolean = false;

	$: challengeurl = `/form/${shortenFormId(data.form.id)}/altcha`;
	$: error = data.error;
</script>

<div class="max-w-lg mx-auto py-12">
	<Form
		action={`/form/${shortenFormId(data.form.id)}/submit_handle`}
		data={{
			__referrer: data.referrer,
			...data.formData
		}}
		bind:loading
	>
		<div class="flex flex-col gap-6">
			{#if error}
				<div>
					<p class="text-2xl">{$_('title.something_went_wrong')}</p>
				</div>

				<div>
					<div class="flex gap-6 bg-error/10 p-4 rounded-lg">
						<div>
							<AlertIcon class="w-6 h-6 text-error" />
						</div>

						<div>
							<div class="font-bold">{error.error}</div>

							{#if error.details}
								<ul class="list-disc pl-5">
									{#each error.details as item}
										<li>{item.message}</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-3">
					<p class="text-2xl">{$_('title.security_check')}</p>

					<p>{$_('text.security_check')}</p>
				</div>

				<div>
					<div class="bg-base-100 w-full max-w-[260px]">
						{#if data.form.captchaInvisible}
							<AltchaInvisible bind:loading {challengeurl} />
						{:else}
							<Altcha auto={data.form.captchaAuto} {challengeurl} />
						{/if}
					</div>
				</div>

				<div>
					<button type="submit" class="btn btn-neutral btn-wide" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						<span class="grow">{$_('button.confirm')}</span>
						<CheckIcon class="w-5 h-5" />
					</button>
				</div>
			{/if}
		</div>
	</Form>
</div>
