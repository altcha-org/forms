<script lang="ts">
	import { _ } from 'svelte-i18n';
	import CheckIcon from '$lib/components/icons/Check.svelte';
	import Form from '$lib/components/Form.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let submitted = false;

	function onSubmit() {
		submitted = true;
	}
</script>

<div class="bg-base-100 p-5 md:rounded-xl md:shadow-lg w-full md:max-w-sm">
	<Form on:submit={() => onSubmit()} let:loading>
		<div class="flex flex-col gap-6">
			<div class="text-xl font-light">{$_('title.verify_email')}</div>

			{#if submitted}
				<div class="flex flex-col items-center gap-3 bg-base-200 p-5 rounded-md">
					<div>
						<CheckIcon class="w-6 h-6 opacity-60" />
					</div>
					<div>{$_('text.email_verified')}</div>
				</div>
			{:else if !data.email}
				<div class="flex flex-col items-center gap-3 bg-base-200 p-5 rounded-md">
					<div>{$_('text.wrong_link')}</div>
				</div>
			{:else}
				<div>
					<p>{$_('text.verify_email')}</p>
				</div>

				<div class="flex items-center gap-1">
					<span class="font-bold">{data.email}</span>
				</div>

				<div>
					<button type="submit" class="btn btn-primary w-full" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{/if}
						{$_('button.verify')}
					</button>
				</div>
			{/if}
		</div>
	</Form>
</div>
