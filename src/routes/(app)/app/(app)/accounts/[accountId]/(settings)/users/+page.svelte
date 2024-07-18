<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Avatar from '$lib/components/Avatar.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TextInput from '$lib/components/blocks/TextInput.svelte';
	import SelectInput from '$lib/components/blocks/SelectInput.svelte';
	import Form from '$lib/components/Form.svelte';
	import PlusIcon from '$lib/components/icons/Plus.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import TimeIcon from '$lib/components/icons/Time.svelte';
	import CloseIcon from '$lib/components/icons/Close.svelte';
	import EditIcon from '$lib/components/icons/Edit.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import LimitReached from '$lib/components/LimitReached.svelte';
	import List from '$lib/components/List.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import ToggleInput from '$lib/components/blocks/ToggleInput.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import { getTimeZone } from '$lib/helpers';
	import type { PageData } from './$types';

	type User = (typeof data.users)[number];
	type Invite = (typeof data.invites)[number];

	const roles = ['admin', 'member'];

	export let data: PageData;

	let emergencyUser: boolean = false;
	let inviteModalOpen: boolean = false;
	let updateInviteModalOpen: boolean = false;
	let updateUserModalOpen: boolean = false;
	let updateInvite: Invite;
	let updateUser: User;

	$: users = data.users;

	function onUpdateInvite(invite: Invite) {
		updateInvite = invite;
		updateInviteModalOpen = true;
	}

	function onUpdateUser(user: User) {
		updateUser = user;
		updateUserModalOpen = true;
	}
</script>

{#if !data.canAddUsers}
	<LimitReached />
{/if}

<div>
	<button
		type="button"
		class="btn btn-primary"
		disabled={!data.canAddUsers}
		on:click|preventDefault={() => (inviteModalOpen = true)}
	>
		<PlusIcon class="w-4 h-4" />
		<span>{$_('button.invite_user')}</span>
	</button>
</div>

<List items={users} let:item={user}>
	<div class="flex items-center gap-4">
		<div>
			<Avatar name={user.user.name} size="md" />
		</div>

		<div class="grow">
			<div class="font-bold">{user.user.name}</div>
			<div class="text-sm flex gap-2">
				<span class="">{user.user.email}</span>
				{#if user.user.emergency}
					<span class="badge badge-warning">{$_('label.emergency_user')}</span>
				{:else}
					<span class="badge badge-ghost">{$_('role.' + user.role)}</span>
				{/if}
			</div>
		</div>

		<div>
			{#if data.user && user.user.id !== data.user.id}
				<div class="dropdown dropdown-end dropdown-bottom">
					<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
						<MoreHorizontalIcon class="w-4 h-4" />
					</div>
					<DropdownMenu autoclose>
						<ul class="menu gap-1">
							<li class="menu-title">{$_('label.actions')}</li>
							{#if !user.user.emergency}
								<li>
									<button
										type="button"
										class="grow flex"
										on:click|preventDefault={() => onUpdateUser(user)}
									>
										<span class="grow">{$_('button.edit')}</span>
										<EditIcon class="w-4 h-4" />
									</button>
								</li>
							{/if}
							<li>
								<Form
									action="?/deleteUser"
									class="grow flex"
									confirmText={$_('text.confirm_remove', { values: { name: user.user.name } })}
									data={{ userId: user.userId }}
								>
									<button type="submit" class="grow flex items-center">
										<span class="grow text-left">{$_('button.delete')}</span>
										<DeleteIcon class="w-4 h-4" />
									</button>
								</Form>
							</li>
						</ul>
					</DropdownMenu>
				</div>
			{/if}
		</div>
	</div>
</List>

{#if data.invites.length}
	<div class="mb-12">
		<div class="text-xl mb-3">{$_('title.invited_user')}</div>

		<List items={data.invites} let:item={invite}>
			<div class="flex items-center gap-4">
				<div class="grow flex flex-col gap-1">
					<div>{invite.email}</div>
					<div class="flex gap-1 items-center text-sm">
						{#if invite.status === 'pending'}
							<TimeIcon class="w-3 h-3" />
						{:else if invite.status === 'declined'}
							<CloseIcon class="w-3 h-3" />
						{/if}
						<span>{$_('status.' + invite.status)}</span>
						<span class="badge badge-ghost">{$_('role.' + invite.role)}</span>
					</div>
				</div>

				<div>
					<div class="dropdown dropdown-end dropdown-bottom">
						<div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-square">
							<MoreHorizontalIcon class="w-4 h-4" />
						</div>
						<DropdownMenu autoclose>
							<ul class="menu gap-1">
								<li class="menu-title">{$_('label.actions')}</li>
								<li>
									<button
										type="button"
										class="grow flex"
										on:click|preventDefault={() => onUpdateInvite(invite)}
									>
										<span class="grow">{$_('button.edit')}</span>
										<EditIcon class="w-4 h-4" />
									</button>
								</li>
								<li>
									<Form
										action="?/deleteInvite"
										class="grow flex"
										confirmText={$_('text.confirm_remove', { values: { name: invite.email } })}
										data={{ email: invite.email }}
									>
										<button type="submit" class="grow flex items-center">
											<span class="grow text-left">{$_('button.delete')}</span>
											<DeleteIcon class="w-4 h-4" />
										</button>
									</Form>
								</li>
							</ul>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</List>
	</div>
{/if}

<Modal action="?/inviteUser" title={$_('title.invite_user')} bind:open={inviteModalOpen}>
	<input type="hidden" name="tz" value={getTimeZone()} />

	{#if inviteModalOpen}
		<div class="flex flex-col gap-6">
			<TextInput
				block={{
					label: $_('label.email'),
					help: $_('help.user_email'),
					name: 'email',
					required: true
				}}
			/>

			<SelectInput
				block={{
					label: $_('label.role'),
					help: $_('help.user_role'),
					name: 'role',
					options: {
						options: roles.map((value) => ({ label: $_('role.' + value), value }))
					},
					required: true
				}}
				disabled={emergencyUser}
			/>

			{#if data.emergencyAccessEnabled}
				<input type="hidden" name="role" value="admin" />

				<ToggleInput
					block={{
						label: $_('label.emergency_user'),
						help: $_('help.emergency_user'),
						name: 'emergency'
					}}
					bind:value={emergencyUser}
				/>

				{#if emergencyUser}
					<PasswordInput
						autocomplete="one-time-code"
						generate="password"
						block={{
							label: $_('label.emergency_user_password'),
							help: $_('help.emergency_user_password'),
							name: 'emergencyPassword',
							options: {
								minLength: 8
							}
						}}
					/>
				{/if}
			{/if}
		</div>
	{/if}
</Modal>

<Modal action="?/updateUser" title={updateUser?.user?.name} bind:open={updateUserModalOpen}>
	<input type="hidden" name="userId" value={updateUser?.userId} />

	<div class="flex flex-col gap-6">
		<SelectInput
			block={{
				label: $_('label.role'),
				help: $_('help.user_role'),
				name: 'role',
				options: {
					options: roles.map((value) => ({ label: $_('role.' + value), value }))
				},
				required: true
			}}
			value={updateUser?.role}
		/>
	</div>
</Modal>

<Modal action="?/updateInvite" title={updateInvite?.email} bind:open={updateInviteModalOpen}>
	<input type="hidden" name="email" value={updateInvite?.email} />

	<div class="flex flex-col gap-6">
		<SelectInput
			block={{
				name: 'role',
				options: {
					options: roles.map((value) => ({ label: $_('role.' + value), value }))
				},
				required: true,
				type: 'SelectInput'
			}}
			value={updateInvite?.role}
		/>
	</div>
</Modal>
