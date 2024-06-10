<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import StarFillIcon from '$lib/components/icons/StarFill.svelte';
	import StarIcon from '$lib/components/icons/Star.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial;
	export let error: string | undefined = void 0;
	export let disabled: boolean = false;
	export let preview: boolean = false;
	export let value: number | null | undefined = block.default ? +block.default : void 0;
	export let visible: boolean = true;

	const emoji = ['🙁', '😬', '🙂', '😊', '🤩'];

	$: max = block.options?.max || 5;
	$: style = block.options?.style?.toLowerCase() || 'stars';

	function onRatingClick(rating: number) {
		if (!disabled) {
			value = rating;
		}
	}
</script>

<BaseInput {block} {error} {value} on:change>
	<div
		class="flex gap-2"
		class:!gap-1={style === 'numbers'}
		aria-required={visible && !preview && block.required}
	>
		{#each Array(max) as _, i}
			{@const rating = i + 1}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
			<label
				class="flex"
				class:cursor-pointer={!disabled}
				class:grow={style === 'numbers'}
				on:click|preventDefault={() => onRatingClick(rating)}
			>
				<input
					type="radio"
					name={block.name}
					required={visible && !preview && block.required}
					value={rating}
					class="appearance-none"
					bind:group={value}
				/>

				{#if style === 'numbers'}
					<div
						class="grow h-10 border border-base-200 rounded-md inline-flex justify-center items-center"
						class:hover:bg-base-200={!disabled && (!value || value < rating)}
						class:bg-base-content={value && value >= rating}
						class:text-base-100={value && value >= rating}
					>
						{rating}
					</div>
				{:else if style === 'emoji'}
					{#if emoji[i]}
						<div
							class="text-3xl transition-transform"
							class:hover:scale-110={!disabled}
							class:opacity-50={value && value != rating}
							class:grayscale={value && value != rating}
							class:!scale-125={value && value == rating}
						>
							{emoji[i]}
						</div>
					{/if}
				{:else if style === 'stars'}
					{#if value && value >= rating}
						<StarFillIcon class="w-6 h-6 text-warning" />
					{:else}
						<StarIcon
							class="w-6 h-6 opacity-40 {!disabled ? 'hover:text-warning hover:opacity-100' : ''}"
						/>
					{/if}
				{/if}
			</label>
		{/each}
	</div>
</BaseInput>
