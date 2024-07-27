<script lang="ts">
	import BaseInput from '$lib/components/blocks/BaseInput.svelte';
	import StarFillIcon from '$lib/components/icons/StarFill.svelte';
	import StarIcon from '$lib/components/icons/Star.svelte';
	import type { IFormBlockPartial } from '$lib/types';

	export let block: IFormBlockPartial<{
		max?: string | number;
		style?: string;
	}>;
	export let error: string | undefined = void 0;
	export let disabled: boolean = false;
	export let preview: boolean = false;
	export let readonly: boolean = false;
	export let value: string | undefined = void 0;
	export let selected: number | undefined =
		value !== void 0 ? +value : block.default ? +block.default : void 0;
	export let visible: boolean = true;

	const emoji = ['🙁', '😬', '🙂', '😊', '🤩'];

	$: max = style === 'emoji' ? 5 : parseInt(String(block.options?.max || '0'), 10) || 5;
	$: style = block.options?.style?.toLowerCase() || 'stars';
	$: onSelectedChange(selected);
	$: onValueChange(value);

	function onSelectedChange(_: typeof selected) {
		value = selected !== void 0 ? String(selected) : void 0;
	}

	function onValueChange(_: typeof value) {
		if (value && +value !== selected) {
			selected = +value;
		} else if (value === void 0) {
			selected = void 0;
		}
	}

	function onRatingClick(rating: number) {
		if (!disabled && !readonly) {
			selected = rating;
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
					readonly={readonly || block.readonly}
					value={rating}
					class="appearance-none"
					bind:group={selected}
				/>

				{#if style === 'numbers'}
					<div
						class="grow h-10 border border-base-200 rounded-md inline-flex justify-center items-center"
						class:hover:bg-base-200={!disabled && (!selected || selected < rating)}
						class:bg-base-content={selected && selected >= rating}
						class:text-base-100={selected && selected >= rating}
					>
						{rating}
					</div>
				{:else if style === 'emoji'}
					{#if emoji[i]}
						<div
							class="text-3xl transition-transform"
							class:hover:scale-110={!disabled}
							class:opacity-50={selected && selected != rating}
							class:grayscale={selected && selected != rating}
							class:!scale-125={selected && selected == rating}
						>
							{emoji[i]}
						</div>
					{/if}
				{:else if style === 'stars'}
					{#if selected && selected >= rating}
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
