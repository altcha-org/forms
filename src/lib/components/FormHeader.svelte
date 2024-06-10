<script lang="ts">
	import type { IForm } from '$lib/types';

	export let form: IForm;
</script>

<div>
	{#if form.banner || form.logo}
		<div class="w-full max-w-5xl relative min-h-40 lg:min-h-48 mx-auto">
			{#if form.banner}
				<img
					src={`/storage/${form.banner}`}
					alt=""
					class="w-full h-40 lg:h-56 bg-base-200 object-cover lg:rounded-b-3xl"
				/>
			{/if}

			{#if form.logo}
				<div class="bg-base-100 rounded-xl --shadow-xl overflow-hidden absolute -bottom-3 left-5">
					<img
						src={`/storage/${form.logo}`}
						alt=""
						class="w-32 h-32 lg:w-44 lg:h-44 object-contain"
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
