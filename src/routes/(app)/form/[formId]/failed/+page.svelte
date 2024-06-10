<script lang="ts">
	import { _ } from 'svelte-i18n';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import AlertIcon from '$lib/components/icons/Alert.svelte';
	import { shortenFormId } from '$lib/helpers';
	import type { PageData } from './$types';

	export let data: PageData;

	$: form = data.form;
</script>

<div class="flex flex-col items-center gap-6 my-12">
	<div>
		<div class="w-14 h-14 rounded-full flex justify-center items-center bg-success/10">
			<AlertIcon class="w-8 h-8 text-error" />
		</div>
	</div>

	<div class="max-w-md text-center prose text-base-content text-lg mb-8">
		<MarkdownRenderer value={$_('text.form_submission_failed')} />
	</div>

	<div>
		<a href="/form/{shortenFormId(form.id)}" class="text-sm link opacity-60"
			>{$_('button.go_back')}</a
		>
	</div>
</div>
