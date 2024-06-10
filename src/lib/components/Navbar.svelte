<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import Avatar from '$lib/components/Avatar.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import LogoutIcon from '$lib/components/icons/Logout.svelte';
	import SettingsIcon from '$lib/components/icons/Settings.svelte';
	import ArrowDownIcon from '$lib/components/icons/ArrowDown.svelte';
	import GroupIcon from '$lib/components/icons/Group.svelte';
	import AltchaIcon from '$lib/components/icons/Altcha.svelte';
	import { darkTheme } from '$lib/stores';

	$: selectedAccount = $page.data.account;
	$: user = $page.data.user;
</script>

<div class="sticky top-0 z-50 bg-base-100">
	<div
		class="navbar bg-primary text-primary-content px-3 lg:px-12 gap-3 lg:gap-6 {$darkTheme
			? 'bg-primary/40'
			: ''}"
	>
		<div class="grow">
			<a href="/app" class="inline-flex gap-6 items-center">
				<AltchaIcon class="w-8 h-8" />

				<div class="tracking-wide">
					<div class="text-xs font-light leading-tight">ALTCHA</div>
					<div class="text-lg font-semibold leading-tight">Forms</div>
				</div>
			</a>
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
