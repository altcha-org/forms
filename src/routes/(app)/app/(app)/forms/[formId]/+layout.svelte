<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import Form from '$lib/components/Form.svelte';
	import FormRenderer from '$lib/components/FormRenderer.svelte';
	import FormHeader from '$lib/components/FormHeader.svelte';
	import FormFooter from '$lib/components/FormFooter.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Head from '$lib/components/Head.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Page from '$lib/components/Page.svelte';
	import DetailIcon from '$lib/components/icons/Detail.svelte';
	import OpenLinkIcon from '$lib/components/icons/OpenLink.svelte';
	import ClipboardIcon from '$lib/components/icons/Clipboard.svelte';
	import DownloadIcon from '$lib/components/icons/Download.svelte';
	import MoreIcon from '$lib/components/icons/More.svelte';
	import QrCodeIcon from '$lib/components/icons/QrCode.svelte';
	import Export from '$lib/components/Export.svelte';
	import bubble from '$lib/bubble';
	import { formatTimeAgo } from '$lib/format';
	import { form, formExport, formExportResponses, formPreview } from '$lib/stores';
	import { copyToClipboard, clone, shortenFormId, forceDownload } from '$lib/helpers';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	setContext('limitFileSize', data.limitFileSize);

	let qrCodeModalOpen: boolean = false;

	$: $form = clone(data.form);
	$: isAdmin = data.accountRole === 'admin';
	$: formLinkRelative = `/form/${shortenFormId($form.id)}`;
	$: formLink = new URL(
		formLinkRelative,
		browser ? location.origin : 'http://localhost'
	).toString();

	async function generateQR() {
		if (browser) {
			const QRCode = await import('qrcode');
			return QRCode.toDataURL(formLink, {
				width: 300
			});
		}
		return null;
	}
</script>

<svelte:head>
	<title>{$form.name} | ALTCHA Forms</title>
</svelte:head>

<Head
	baseUrl="/app/forms/{$form.id}"
	tabs={[
		{
			href: '/inbox',
			label: $_('label.inbox')
		},
		{
			href: '/analytics',
			label: $_('label.analytics')
		},
		{
			href: '/design',
			label: $_('label.design')
		},
		{
			href: '/processors',
			label: $_('label.processors')
		},
		{
			href: '/settings',
			label: $_('label.settings')
		},
		{
			href: '/security',
			label: $_('label.security')
		},
		{
			hidden: !isAdmin,
			href: '/access',
			label: $_('label.access')
		},
		{
			hidden: !isAdmin,
			href: '/delete',
			label: $_('label.delete')
		}
	]}
>
	<ul slot="breadcrumbs">
		<li>
			<a href="/app/accounts/{data.form.accountId}/forms">{$_('label.forms')}</a>
		</li>
	</ul>

	<div class="flex flex-wrap gap-2 mb-1">
		<div class="grow flex items-end gap-3 truncate">
			<div class="text-xl xl:text-2xl font-bold max-w-[12rem] lg:max-w-md truncate">
				{$form.name}
			</div>
		</div>

		<div class="flex gap-2">
			{#if $form.status === 'draft'}
				<Form action="/app/forms/{$form.id}/settings?/publishForm" let:loading>
					<button class="btn btn-sm btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							{$_('button.publish')}
						{/if}
					</button>
				</Form>
			{:else if $form.status === 'published'}
				<a href={formLink} target="_blank" class="btn btn-sm">
					<OpenLinkIcon class="w-4 h-4" />
					<span class="hidden lg:inline">{$_('button.open')}</span>
				</a>
			{/if}

			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-sm btn-square gap-2">
					<MoreIcon class="w-5 h-5" />
				</div>
				<DropdownMenu>
					<ul class="menu gap-1">
						<li class="menu-title">{$_('label.actions')}</li>
						<li>
							<button
								type="button"
								class="justify-between"
								use:bubble={{
									handler: () => copyToClipboard(formLink),
									text: $_('text.copied')
								}}
							>
								<span>{$_('button.copy_address')}</span>
								<ClipboardIcon class="w-4 h-4" />
							</button>
						</li>
						<li>
							<button
								type="button"
								class="justify-between"
								on:click|preventDefault={() => (qrCodeModalOpen = true)}
							>
								<span>{$_('button.qr_code')}</span>
								<QrCodeIcon class="w-4 h-4" />
							</button>
						</li>
						<li>
							<button
								type="button"
								class="justify-between"
								on:click|preventDefault={() => ($formPreview = true)}
							>
								<span>{$_('button.preview')}</span>
								<DetailIcon class="w-4 h-4" />
							</button>
						</li>
						<li>
							<button
								type="button"
								class="justify-between"
								on:click|preventDefault={() => ($formExport = true)}
							>
								<span>{$_('button.export_responses')}</span>
								<DownloadIcon class="w-4 h-4" />
							</button>
						</li>
					</ul>
				</DropdownMenu>
			</div>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
		<div>
			<span
				class="badge"
				class:badge-ghost={$form.status === 'archived'}
				class:badge-neutral={$form.status === 'draft'}
				class:badge-success={$form.status === 'published'}>{$_('status.' + $form.status)}</span
			>
		</div>

		<div class="flex items-center flex-wrap gap-x-2 text-xs lg:text-sm opacity-60">
			<span class="w-full lg:w-auto"
				>{$_('label.created_ago', { values: { ago: formatTimeAgo($form.createdAt) } })}</span
			>
		</div>
	</div>
</Head>

<Page>
	<slot />
</Page>

<Modal
	action=""
	buttonLabel={$_('button.close')}
	cancelable={false}
	fullscreen
	padding={false}
	title={$_('title.preview')}
	bind:open={$formPreview}
>
	<div class="max-w-4xl mx-auto lg:px-12">
		<div class="min-h-screen">
			<FormHeader form={data.form} />

			<div class="px-3 lg:px-5 pb-12">
				<FormRenderer preview form={$form} />
			</div>
		</div>

		<FormFooter preview form={data.form} />
	</div>
</Modal>

<Modal
	action=""
	title={$_('title.export')}
	hideButton
	bind:open={$formExport}
	on:close={() => ($formExportResponses = [])}
>
	{#if $formExport}
		<Export
			form={data.form}
			responseIds={$formExportResponses.length ? $formExportResponses : null}
			on:finish={() => ($formExport = false)}
		/>
	{/if}
</Modal>

<Modal action="" hideButton title={$_('title.qr_code')} bind:open={qrCodeModalOpen}>
	<div class="flex flex-col gap-3">
		<div>
			<div class="input input-bordered shadow-sm flex items-center">
				<div class="grow truncate">{formLink}</div>
				<div>
					<button
						type="button"
						use:bubble={{
							handler: () => copyToClipboard(formLink),
							text: $_('text.copied')
						}}
					>
						<ClipboardIcon class="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>

		{#await generateQR() then url}
			{#if url}
				<div class="flex items-center justify-center border input-bordered p-3 rounded shadow-sm">
					<img src={url} alt="QR Code" width="200" />
				</div>

				<div>
					{#await fetch(url).then((r) => r.arrayBuffer()) then ab}
						<button
							type="button"
							class="link"
							on:click|preventDefault={() => forceDownload(ab, 'qrcode.png')}
							>{$_('button.download')}</button
						>
					{/await}
				</div>
			{/if}
		{/await}
	</div>
</Modal>
