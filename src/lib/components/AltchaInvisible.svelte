<script lang="ts">
	import { onMount } from 'svelte';
	import { solveChallengeWorkers } from 'altcha-lib';
	import InlineAltchaWorker from 'altcha-lib/worker?worker&inline';

	export let challengeurl: string;
	export let loading: boolean = false;
	export let name: string = 'altcha';
	export let verified: boolean = false;

	let elInput: HTMLInputElement;
	let elForm: HTMLFormElement | null = null;
	let payload: string = '';

	onMount(() => {
		elForm = elInput.closest('form');
		elForm?.addEventListener('submit', onFormSubmit, {
			capture: true
		});
	});

	async function onFormSubmit(ev: SubmitEvent) {
		if (elForm && !verified) {
			ev.preventDefault();
			ev.stopPropagation();
			verify().then(() => {
				requestAnimationFrame(() => {
					elForm?.requestSubmit();
				});
			});
		}
	}

	export async function verify() {
		loading = true;
		verified = false;
		payload = '';
		try {
			const resp = await fetch(challengeurl);
			if (resp.status !== 200) {
				throw new Error(`Server responded with ${resp.status}`);
			}
			const challenge = await resp.json();
			if (!challenge || !challenge.challenge) {
				throw new Error(`Unexpected server response.`);
			}
			const solution = await solveChallengeWorkers(
				() => new InlineAltchaWorker(),
				navigator.hardwareConcurrency || 8,
				challenge.challenge,
				challenge.salt,
				challenge.algorithm,
				challenge.max
			);
			verified = !!solution;
			if (solution) {
				payload = btoa(
					JSON.stringify({
						...challenge,
						number: solution.number
					})
				);
			}
		} finally {
			loading = false;
		}
	}
</script>

<input bind:this={elInput} type="hidden" {name} value={payload} />
