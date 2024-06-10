<script lang="ts">
	import { page } from '$app/stores';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import '../app.scss';
</script>

<div class="flex flex-col items-center gap-6 my-12">
	<div>
		<div class="w-14 h-14 rounded-full flex justify-center items-center bg-base-content/10">
			<AlertIcon class="w-8 h-8 text-error" />
		</div>
	</div>

	<div class="max-w-md text-center prose text-base-content text-lg mb-8">
		<p>{$page.error?.message}</p>
	</div>

	<div>
		<a href="/app" class="text-sm link opacity-60">Go to App</a>
	</div>
</div>
