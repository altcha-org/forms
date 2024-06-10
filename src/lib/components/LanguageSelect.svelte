<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { availableLocales } from '$lib/i18n';
	import TranslateIcon from '$lib/components/icons/Translate.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import { language } from '$lib/stores';

	$: selected =
		availableLocales[$locale as keyof typeof availableLocales] || availableLocales['en-GB'];

	function setLocale(lang: string) {
		$locale = lang;
		$language = lang;
	}
</script>

<div class="dropdown dropdown-top">
	<div tabindex="0" role="button" class="btn btn-ghost btn-sm">
		<TranslateIcon class="w-4 h-4" />
		{selected}
	</div>
	<DropdownMenu autoclose>
		<ul class="menu gap-1">
			<li class="menu-title">{$_('label.languages')}</li>
			{#each Object.entries(availableLocales) as [code, name]}
				<li>
					<button type="button" on:click={() => setLocale(code)}>
						<span>{name}</span>
					</button>
				</li>
			{/each}
		</ul>
	</DropdownMenu>
</div>
