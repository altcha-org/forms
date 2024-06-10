<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { formatTimeAgo } from '$lib/format';
	import Form from '$lib/components/Form.svelte';
	import List from '$lib/components/List.svelte';
	import Page from '$lib/components/Page.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import SettingsIcon from '$lib/components/icons/Settings.svelte';
	import LogIcon from '$lib/components/icons/Log.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: accounts = data.user?.accounts || [];
	$: canCreateAccount = data.maxFreeAccounts === 0 || data.freeAccounts < data.maxFreeAccounts;
	$: invites = data.invites || [];
</script>

<Page title={$_('label.accounts')}>
	{#if invites.length}
		<div class="text-2xl font-bold">{$_('label.invites')}</div>

		<div class="flex flex-col gap-6 mb-6">
			{#each invites as invite}
				<div class="flex flex-col gap-3 border-2 border-primary rounded-md p-5">
					<div>
						<div class="font-bold">{invite.account.name}</div>
						<div class="text-sm opacity-60">
							<span>{$_('role.' + invite.role)}</span>
							<span>&bull;</span>
							<span>{formatTimeAgo(invite.createdAt)}</span>
							<span>&bull;</span>
							<span>{$_('text.invited_by', { values: { name: invite.inviter.name } })}</span>
						</div>
					</div>
					<div class="flex gap-3">
						<Form action="?/acceptInvite" data={{ inviteId: invite.id }}>
							<button type="submit" class="btn btn-primary">{$_('button.accept')}</button>
						</Form>
						<Form action="?/declineInvite" data={{ inviteId: invite.id }}>
							<button type="submit" class="btn btn-ghost opacity-60 hover:opacity-100"
								>{$_('button.decline')}</button
							>
						</Form>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div>
		<a href="/app/accounts/create" class="btn btn-primary" class:disabled={!canCreateAccount}>
			<PlusIcon class="w-4 h-4" />
			<span>{$_('button.create_account')}</span>
		</a>
	</div>

	<List items={accounts} let:item={account}>
		<div class="flex flex-wrap items-center gap-3">
			<div class="grow w-full lg:w-auto">
				<div>
					<a href="/app/accounts/{account.account.id}/dashboard" class="link text-lg font-bold"
						>{account.account.name}</a
					>
				</div>
				{#if account.account.plan?.name}
					<div class="text-sm opacity-60">
						{$_('text.using_plan', { values: { plan: account.account.plan?.name } })}
					</div>
				{/if}
			</div>
			<div class="flex gap-2">
				{#if account.account.plan?.featureAuditlog && account.account.auditlog && account.role === 'admin'}
					<a href="/app/accounts/{account.account.id}/auditlog" class="btn btn-sm">
						<LogIcon class="w-4 h-4" />
						<span>{$_('button.audit_log')}</span>
					</a>
				{/if}

				{#if account.role === 'admin'}
					<a href="/app/accounts/{account.account.id}/settings" class="btn btn-sm">
						<SettingsIcon class="w-4 h-4" />
						<span>{$_('button.settings')}</span>
					</a>
				{/if}
			</div>
		</div>
	</List>
</Page>
