<script lang="ts">
	export let autoclose: boolean = false;

	function onClick(ev: MouseEvent) {
		if (autoclose) {
			const target = ev.target as HTMLElement;
			const btn = target.closest('button');
			if (btn) {
				btn.blur();
			}
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	tabindex="0"
	class="dropdown-content z-50 -mt-1 shadow-2xl bg-base-100 text-base-content rounded-lg w-64 {$$restProps.class ||
		''}"
	on:click={onClick}
>
	<slot />
</div>
