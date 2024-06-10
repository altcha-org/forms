<script lang="ts">
	import { darkTheme } from '$lib/stores';

	export let image: string | undefined = void 0;
	export let name: string = '';
	export let size: 'sm' | 'md' = 'md';

	$: initials = name ? getInitials(name) : '';
	$: hslColor = name ? generateHSLColor(name) : 'hsl(var(--b2))';

	function getInitials(str: string) {
		const parts = str.split(/[^\w]/).slice(0, 2);
		if (parts.length === 1) {
			return parts[0].slice(0, 1).toUpperCase() + parts[0].slice(1, 2);
		}
		return parts?.map((p) => p.slice(0, 1).toUpperCase()).join('');
	}

	function generateHSLColor(str: string, saturation: number = 40, lightness: number = 80) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return `hsl(${hash % 360}, ${saturation}%, ${lightness}%)`;
	}
</script>

<div class="avatar placeholder">
	<div
		class="mask mask-squircle"
		class:w-8={size === 'sm'}
		class:w-12={size === 'md'}
		style="background-color: {hslColor};"
	>
		{#if image}
			<img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" alt="" />
		{:else}
			<span
				class:text-sm={size === 'sm'}
				class:text-base-content={!$darkTheme}
				class:text-base-100={$darkTheme}>{initials}</span
			>
		{/if}
	</div>
</div>
