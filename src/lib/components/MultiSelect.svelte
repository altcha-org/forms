<script lang="ts">
	import Popover from '$lib/components/Popover.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDown.svelte';
	import CloseIcon from './icons/Close.svelte';

	export let allowCustomOptions: boolean = false;
	export let maxItems: number = 0;
	export let placeholder: string = '';
	export let value: string[] = [];
	export let options: { label: string; value: string }[] = [];

	let elFilter: HTMLInputElement;
	let elMenu: HTMLElement;
	let filter: string = '';
	let popoverOpen: boolean = false;

	$: filteredOptions = filter
		? options.filter((option) => option.label.toLowerCase().includes(filter.toLowerCase()))
		: options;

	function addOption(option: string) {
		if ((!maxItems || value.length < maxItems) && !value.includes(option)) {
			value = [...value, option];
		}
	}

	function cycleOptions(dir: number) {
		if (elMenu) {
			const items = [...elMenu.querySelectorAll('button')];
			const activeIdx = items.findIndex((item) => item.classList.contains('active'));
			items[activeIdx]?.classList.remove('active');
			items[activeIdx + dir]?.classList.add('active');
		}
	}

	function onAddOption() {
		if (filter && allowCustomOptions) {
			addOption(filter);
			filter = '';
			elFilter?.focus();
		}
	}

	function onKeyDown(ev: KeyboardEvent) {
		if (ev.key === 'ArrowDown' || (ev.key === 'Tab' && !ev.shiftKey)) {
			ev.preventDefault();
			ev.stopPropagation();
			cycleOptions(1);
		} else if (ev.key === 'ArrowUp' || (ev.key === 'Tab' && ev.shiftKey)) {
			ev.preventDefault();
			ev.stopPropagation();
			cycleOptions(-1);
		} else if (ev.key === 'Enter') {
			const activeEl = elMenu?.querySelector('.active') as HTMLButtonElement;
			if (activeEl) {
				ev.preventDefault();
				ev.stopPropagation();
				activeEl.click();
			} else if (filter) {
				ev.preventDefault();
				ev.stopPropagation();
				onAddOption();
			}
		} else if (ev.key === 'Escape') {
			if (popoverOpen) {
				ev.preventDefault();
				popoverOpen = false;
			}
		}
	}

	function onSelectOption(option: string) {
		if (value.includes(option)) {
			value = value.filter((v) => v !== option);
		} else {
			addOption(option);
		}
		if (filter) {
			filter = '';
		}
		resetActive();
	}

	function onRemoveOption(option: string) {
		value = value.filter((v) => v !== option);
	}

	function resetActive() {
		elMenu?.querySelector('.active')?.classList.remove('active');
	}
</script>

<Popover dropdown sameWidth bind:open={popoverOpen}>
	<div class="input input-bordered shadow-sm h-auto min-h-[3rem] flex items-center gap-1 px-2 py-1">
		<div class="grow flex flex-wrap items-center gap-1">
			{#if value}
				{#each value as v}
					<Tag value={v} removable on:remove={() => onRemoveOption(v)} />
				{/each}
			{/if}

			<input
				bind:this={elFilter}
				type="text"
				class="grow shrink border-none outline-none min-h-[2rem] min-w-[8rem] pl-2"
				{placeholder}
				data-popover-input
				bind:value={filter}
				on:keydown={onKeyDown}
			/>
		</div>

		<div class="pr-1 pt-1">
			<button type="button" on:click|preventDefault={() => elFilter?.focus()}>
				<ArrowDownIcon class="w-4 h-4" />
			</button>
		</div>
	</div>

	<div bind:this={elMenu} slot="content">
		{#if !filteredOptions.length}
			<div class="px-5 py-3 text-sm opacity-60">No options available.</div>
		{/if}
		{#if filteredOptions.length}
			<ul class="menu gap-1 p-1">
				{#each filteredOptions as option}
					{@const checked = value.includes(option.value)}
					<li>
						<button
							type="button"
							class="justify-between"
							class:font-bold={checked}
							on:click|preventDefault={() => onSelectOption(option.value)}
						>
							<span>{option.label}</span>
							{#if checked}
								<CloseIcon class="w-3 h-3" />
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Popover>
