<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { setContext } from 'svelte';
	import Form from '$lib/components/Form.svelte';
	import FormFooter from '$lib/components/FormFooter.svelte';
	import FormHeader from '$lib/components/FormHeader.svelte';
	import FormRenderer from '$lib/components/FormRenderer.svelte';
	import PasswordInput from '$lib/components/blocks/PasswordInput.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let formPassword: string = '';

	setContext('limitFileSize', data.limitFileSize);

	$: passwordProtected = !!data.form.password;
	$: passwordOk = data.passwordOk;
</script>

<div class="min-h-screen">
	<FormHeader form={data.form} />

	{#if passwordProtected && !passwordOk}
		<div class="py-12">
			<div class="bg-base-200 max-w-sm mx-auto p-6 rounded-lg">
				<Form action="?/submitPassword" autocomplete="off" let:error>
					<div class="flex flex-col gap-6">
						<div class="text-lg font-bold">
							{$_('title.password_protected')}
						</div>

						<div>
							<p>{$_('text.form_password_protected')}</p>
						</div>

						<PasswordInput
							autocomplete="none"
							block={{
								label: $_('label.password'),
								name: 'form_password',
								type: 'PasswordInput'
							}}
							error={error?.fields?.form_password}
							bind:value={formPassword}
						/>

						<div>
							<button type="submit" class="btn btn-primary" disabled={!formPassword}
								>{$_('button.next')}</button
							>
						</div>
					</div>
				</Form>
			</div>
		</div>
	{:else}
		<div class="xl:px-5 pb-12">
			<FormRenderer analytics={data.analytics} encrypted={data.encrypted} form={data.form} />
		</div>
	{/if}
</div>

<FormFooter form={data.form} hidePoweredBy={data.form.hidePoweredBy && data.licenseValid} />
