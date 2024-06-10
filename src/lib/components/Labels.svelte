<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { createEventDispatcher } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import DeleteBackIcon from '$lib/components/icons/DeleteBack.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import type { ILabel } from '$lib/types';

	export let labels: ILabel[] | null = [];

	const disptach = createEventDispatcher();
	const colors = [
		'#dddddd',
		'#f87171',
		'#f97316',
		'#facc15',
		'#bef264',
		'#86efac',
		'#5eead4',
		'#7dd3fc',
		'#c084fc',
		'#f9a8d4'
	];

	function onLabelsChange() {
		disptach('change', { labels });
	}

	function onAddLabel() {
		labels = [...(labels || []), { label: '', color: '' }];
		onLabelsChange();
	}

	function onSetColor(label: ILabel, color: string) {
		label.color = color;
		labels = labels;
		onLabelsChange();
	}

	function onRemoveLabel(label: ILabel) {
		if (confirm($_('text.confirm_remove', { values: { name: label.label } }))) {
			labels = labels?.filter((l) => l !== label) || [];
			onLabelsChange();
		}
	}
</script>

<div class="flex flex-col gap-3 border border-base-content/30 rounded shadow-sm p-2">
	{#if labels}
		{#each labels as label}
			<div class="flex items-center gap-1">
				<div class="grow">
					<input
						type="text"
						class="input input-sm input-bordered w-full"
						placeholder={$_('placeholder.label')}
						bind:value={label.label}
					/>
				</div>

				<div>
					<div class="dropdown dropdown-end dropdown-bottom">
						<div tabindex="0" role="button" class="btn btn-sm btn-square btn-ghost">
							<span class="w-4 h-4 rounded-full" style="background-color: {label.color || '#ddd'};"
							></span>
						</div>
						<DropdownMenu autoclose>
							<div class="grid grid-cols-5 gap-1 p-2 w-full">
								{#each colors as color}
									<div class="flex justify-center">
										<button
											type="button"
											class="btn btn-circle btn-sm btn-ghost"
											on:click={() => onSetColor(label, color)}
										>
											<div class="w-4 h-4 rounded-full" style="background-color: {color};"></div>
										</button>
									</div>
								{/each}
							</div>
						</DropdownMenu>
					</div>
				</div>

				<div>
					<button
						type="button"
						class="btn btn-square btn-sm btn-ghost"
						on:click|preventDefault={() => onRemoveLabel(label)}
					>
						<DeleteBackIcon class="w-4 h-4" />
					</button>
				</div>
			</div>
		{/each}
	{/if}

	<div>
		<button
			type="button"
			class="flex items-center gap-1 text-sm link"
			on:click|preventDefault={() => onAddLabel()}
		>
			<PlusIcon class="w-3 h-3" />
			<span>{$_('button.add_label')}</span>
		</button>
	</div>
</div>
