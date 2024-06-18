<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import { formatTimeShort } from '$lib/format';
	import { stringifyBlockValue } from '$lib/helpers';
	import Form from '$lib/components/Form.svelte';
	import StarFillIcon from '$lib/components/icons/StarFill.svelte';
	import StarIcon from '$lib/components/icons/Star.svelte';
	import NoteIcon from '$lib/components/icons/Note.svelte';
	import ResponseDataProvider from './ResponseDataProvider.svelte';
	import type { IForm, IResponseListItem } from '$lib/types';

	export let form: Pick<IForm, 'id' | 'displayBlocks' | 'labels'>;
	export let response: IResponseListItem;

	const dispatch = createEventDispatcher();

	function onClick(ev: MouseEvent) {
		const target = ev.target as HTMLElement;
		if (!['BUTTON', 'INPUT'].includes(target.tagName)) {
			dispatch('click');
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="flex gap-4 items-start px-5 bg-base-100 hover:bg-primary/5 cursor-pointer focus-within:outline outline-primary"
>
	<div class="flex items-center gap-3 py-3">
		<slot name="checkbox" />

		<Form
			action="/app/forms/{form.id}/inbox?/flagResponse"
			class="flex items-center"
			data={{ responseId: response.id, flag: !response.flag }}
			successToast={false}
			let:loading
		>
			<button type="submit" disabled={loading}>
				{#if response.flag}
					<StarFillIcon class="w-4 h-4 text-warning" />
				{:else}
					<StarIcon class="w-4 h-4 opacity-30" />
				{/if}
			</button>
		</Form>
	</div>

	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<div class="grow flex gap-3 items-start py-2" tabindex="0" on:click={onClick}>
		<div class="grow flex items-center gap-2">
			<div>
				{#if response.encrypted && response.dataEncrypted && response.encryptionKeyHash}
					<ResponseDataProvider
						displayBlocks={form.displayBlocks}
						{response}
						let:headline
						let:responseData
					>
						{#if responseData === null}
							<div class="opacity-60 italic">{$_('label.encrypted')}</div>
						{:else}
							<div class="flex gap-2">
								<div class="max-w-md truncate" class:font-bold={!response.read}>
									<span>{headline}</span>
								</div>
								{#if response.spam}
									<div>
										<span class="badge badge-ghost">{$_('label.spam')}</span>
									</div>
								{/if}
							</div>

							{#each form.displayBlocks.slice(1) as block, i}
								<div class="max-w-md truncate text-sm opacity-60">
									{stringifyBlockValue(responseData[block])}
								</div>
							{/each}
						{/if}
					</ResponseDataProvider>
				{:else if form.displayBlocks.length === 0}
					<div>&mdash;</div>
				{:else}
					{#each form.displayBlocks as block, i}
						<div
							class="max-w-md truncate"
							class:text-sm={i > 0}
							class:opacity-60={i > 0}
							class:font-bold={!response.read && i === 0}
						>
							{stringifyBlockValue(response.data?.[block])}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<div class="flex items-center gap-3 py-3 whitespace-nowrap">
		{#if response.labels?.length}
			<div class="flex mr-1.5">
				{#each response.labels as labelText}
					{@const label = form.labels?.find((l) => l.label === labelText)}
					{#if label}
						<div class="tooltip -mr-1.5" data-tip={label.label}>
							<div
								class="w-4 h-4 rounded-full"
								style="background-color: {label.color || '#ddd'};"
							></div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<div class="text-xs opacity-60 hidden lg:block">{formatTimeShort(response.createdAt)}</div>

		{#if response.notes > 0}
			<a href="/app/responses/{response.id}/notes">
				<NoteIcon class="w-4 h-4 text-base-content/30" />
			</a>
		{/if}
	</div>
</div>
