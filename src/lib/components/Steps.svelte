<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { IFormStep } from '$lib/types';

	export let activeStep: number = 0;
	export let steps: IFormStep[];

	const dispatch = createEventDispatcher();
</script>

<ul class="steps steps-vertical">
	{#each steps as step, i}
		<li class="step" class:step-primary={i < activeStep} class:step-neutral={i === activeStep}>
			<button
				type="button"
				class="text-left"
				class:opacity-60={i !== activeStep}
				on:click|preventDefault={() => dispatch('step', i)}>{step.title || ''}</button
			>
		</li>
	{/each}
</ul>
