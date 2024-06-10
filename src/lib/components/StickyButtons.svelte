<script lang="ts">
	import { _ } from 'svelte-i18n';
	import CheckIcon from '$lib/components/icons/Check.svelte';

	export let buttonLabel: string = $_('button.save');
	export let disabled: boolean = false;
</script>

<div class="sticky bottom-0 left-0 right-0 bg-base-100">
	<div class="max-w-4xl border-t-2 border-base-300 mx-auto flex items-center gap-3 py-3 lg:py-5">
		<div class="flex-1 flex gap-3">
			<button type="submit" class="btn btn-primary btn-wide" {disabled}>
				<span class="flex-1">{buttonLabel}</span>
				<CheckIcon class="w-4 h-4" />
			</button>
			{#if !disabled}
				<button type="reset" class="btn btn-ghost opacity-60">
					<span>{$_('button.cancel')}</span>
				</button>
			{/if}
		</div>

		<div>
			<slot name="aside" />
		</div>
	</div>
</div>
