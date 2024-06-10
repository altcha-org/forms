<script lang="ts">
	import { _ } from 'svelte-i18n';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Form from '$lib/components/Form.svelte';
	import List from '$lib/components/List.svelte';
	import DeleteIcon from '$lib/components/icons/Delete.svelte';
	import MoreHorizontalIcon from '$lib/components/icons/MoreHorizontal.svelte';
	import { formatTimeAgo } from '$lib/format';
	import type { PageData } from './$types';
	import { device } from '$lib/stores';

	export let data: PageData;

	$: currentDeviceId = data.device?.id;
</script>

<List items={data.devices} let:item={device}>
	<div class="flex flex-wrap items-center gap-3">
		<div class="grow flex flex-col gap-1">
			<div>
				<span>{device.name}</span>
				{#if currentDeviceId === device.id}
					<span class="badge badge-ghost">{$_('label.this_device')}</span>
				{/if}
			</div>
			<div class="text-sm opacity-60">
				{$_('label.last_seen_ago', { values: { ago: formatTimeAgo(device.updatedAt) } })}
			</div>
			<div class="text-sm opacity-60">{device.ipAddress} &bull; {device.timezone}</div>
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
							<Form
								action="?/deleteDevice"
								confirmText={$_('text.confirm_remove', { values: { name: device.name } })}
								class="grow flex"
								data={{ deviceId: device.id }}
								let:loading
							>
								<button type="submit" class="grow flex">
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
