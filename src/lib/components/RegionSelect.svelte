<script lang="ts">
	import { _ } from 'svelte-i18n';
	import LocationIcon from '$lib/components/icons/Location.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';

	export let availableRegions: { region: string; url: string }[];
	export let region: string;
</script>

<div class="dropdown dropdown-top">
	<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
		<LocationIcon class="w-4 h-4" />
		{$_('region.' + region)}
	</div>
	<DropdownMenu autoclose>
		<ul class="menu gap-1">
			<li class="menu-title">{$_('label.regions')}</li>
			{#each availableRegions as { region, url }}
				<li>
					<a href={url}>
						<span>{$_('region.' + region)}</span>
					</a>
				</li>
			{/each}
		</ul>
	</DropdownMenu>
</div>
