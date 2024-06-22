<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import Avatar from '$lib/components/Avatar.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import LogoutIcon from '$lib/components/icons/Logout.svelte';
	import SettingsIcon from '$lib/components/icons/Settings.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDown.svelte';
	import SearchIcon from './icons/Search.svelte';
	import AltchaIcon from '$lib/components/icons/Altcha.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Search from '$lib/components/Search.svelte';
	import { darkTheme } from '$lib/stores';

	$: selectedAccount = $page.data.account;
	$: user = $page.data.user;

	let elSearchKbd: HTMLElement;
	let search: Search;
	let searchModalOpen: boolean = false;
	let searchLoading: boolean = false;
	let totalScannedForms: number = 0;
	let totalScannedResponses: number = 0;
	let totalErroredResponses: number = 0;

	function onKeyDown(ev: KeyboardEvent) {
		const activeElement = document.activeElement;
		if (activeElement === document.body && !ev.shiftKey && !ev.ctrlKey && ev.key === '/') {
			ev.preventDefault();
			if (elSearchKbd) {
				elSearchKbd.focus();
			}
			setTimeout(() => {
				if (elSearchKbd) {
					elSearchKbd.blur();
				}
				searchModalOpen = true;
			}, 150);
		}
	}

	function onSearchModalClose() {
		if (document.activeElement && 'blur' in document.activeElement) {
			// @ts-ignore
			document.activeElement.blur();
		}
	}

</script>

<svelte:document on:keydown={onKeyDown}></svelte:document>

<div class="sticky top-0 z-50 bg-base-100">
	<div
		class="navbar bg-primary text-primary-content px-3 lg:px-12 gap-3 lg:gap-6 {$darkTheme
			? 'bg-primary/40'
			: ''}"
	>
		<div class="grow flex justify-between lg:justify-start gap-6 lg:gap-12">
			<a href="/app" class="inline-flex gap-6 items-center">
				<AltchaIcon class="w-8 h-8" />

				<div class="tracking-wide">
					<div class="text-xs font-light leading-tight">ALTCHA</div>
					<div class="text-lg font-semibold leading-tight">Forms</div>
				</div>
			</a>

			{#if selectedAccount}
				<div>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<label
						class="input input-secondary bg-secondary !outline-none flex items-center gap-4 w-full"
						on:click={() => searchModalOpen = true}
					>
						<SearchIcon class="w-4 h-4 shrink-0" />
						<input type="text" class="grow hidden lg:block" readonly placeholder={$_('placeholder.search')} />
						<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
						<kbd
							class="shrink-0 hidden lg:inline-flex kbd kbd-sm bg-secondary border-secondary-content/30 !outline-none focus:border-secondary-content/60"
							tabindex="0"
							bind:this={elSearchKbd}
							>/</kbd>
					</label>
				</div>
			{/if}
		</div>

		<div>
			{#if selectedAccount}
				<div class="dropdown dropdown-end lg:dropdown-start">
					<div
						tabindex="0"
						role="button"
						class="btn btn-secondary btn-square text-primary-content lg:hidden gap-4"
					>
						<ArrowDownIcon class="w-5 h-5" />
					</div>

					<div
						tabindex="0"
						role="button"
						class="btn btn-secondary text-primary-content gap-4 hidden lg:inline-flex max-w-64 flex-nowrap"
					>
						<span class="truncate">{selectedAccount?.name}</span>
						<ArrowDownIcon class="shrink-0 w-4 h-4" />
					</div>

					<DropdownMenu>
						<ul class="menu gap-2">
							{#each user.accounts as { account }}
								<li class="truncate w-full">
									<a
										href="/app/accounts/{account.id}/dashboard"
										class:active={account.id === selectedAccount.id}
									>
										<span class="truncate">{account.name}</span>
									</a>
								</li>
							{/each}
							<li>
								<a href="/app/accounts" class="flex">
									<span class="grow">{$_('button.manage_accounts')}</span>
									<SettingsIcon class="w-4 h-4" />
								</a>
							</li>
						</ul>
					</DropdownMenu>
				</div>
			{/if}
		</div>

		<div class="flex-none">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="">
					<Avatar name={user.name} />
				</div>
				<DropdownMenu>
					<ul class="menu gap-2" data-sveltekit-preload-data="false">
						<li
							class="menu-title text-base-content text-base border-b border-base-300 truncate w-full"
						>
							<div class="truncate w-full">{user.name}</div>
							<span class="text-sm font-normal opacity-60 truncate w-full">{user.email}</span>
						</li>
						<li>
							<a href="/app/profile/settings">{$_('label.profile')}</a>
						</li>
						<li>
							<a href="/app/profile/encryption_keys">{$_('label.encryption_keys')}</a>
						</li>
						<li>
							<a href="/app/logout" class="flex">
								<span class="grow">{$_('button.log_out')}</span>
								<LogoutIcon class="w-4 h-4" />
							</a>
						</li>
					</ul>
				</DropdownMenu>
			</div>
		</div>
	</div>
</div>

<Modal
	title={$_('title.search')}
	hideButton
	
	bind:open={searchModalOpen}
	on:close={() => onSearchModalClose()}
>
	{#if searchModalOpen}
	<Search
		bind:this={search}
		bind:loading={searchLoading}
		bind:totalForms={totalScannedForms}
		bind:totalResponses={totalScannedResponses}
		bind:erroredResponses={totalErroredResponses}
		on:click={() => searchModalOpen = false}
	/>
	{/if}

	<svelte:fragment slot="actions_cancel">
		{#if searchLoading}
		<button type="button" class="btn btn-ghost" on:click|preventDefault={() => search?.stopSearch()}>{$_('button.stop')}</button>
		{/if}
	</svelte:fragment>

	<div slot="actions" class="self-center flex gap-2 text-sm">
		{#if totalScannedForms && totalScannedResponses}
		<span class="opacity-60">
			{$_('text.search_scanned_forms', { values: { count: totalScannedForms } })}
		</span>
		<span class="opacity-20">|</span>
		<span class="opacity-60">
			{$_('text.search_scanned_responses', { values: { count: totalScannedResponses } })}
		</span>
		{/if}
	<div>
</Modal>
