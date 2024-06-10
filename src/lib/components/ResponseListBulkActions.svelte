<script lang="ts">
	import { _ } from 'svelte-i18n';
	import ArrowDownIcon from '$lib/components/icons/ArrowDown.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu.svelte';
	import Form from '$lib/components/Form.svelte';
	import type { IForm } from '$lib/types';

	export let form: Pick<IForm, 'id'>;
	export let selected: string[] = [];
</script>

<div class="dropdown">
	<div tabindex="0" role="button" class="btn btn-sm gap-2">
		<span>{$_('button.bulk_action', { values: { count: selected.length } })}</span>
		<ArrowDownIcon class="w-4 h-4" />
	</div>
	<DropdownMenu>
		<ul class="menu gap-1">
			<li>
				<Form action="/app/forms/{form.id}/inbox?/bulkMarkAsRead" data={{ responses: selected }}>
					<button type="submit">
						<span>{$_('button.mark_as_read')}</span>
					</button>
				</Form>
			</li>
			<li>
				<Form action="/app/forms/{form.id}/inbox?/bulkMarkAsSpam" data={{ responses: selected }}>
					<button type="submit">
						<span>{$_('button.mark_as_spam')}</span>
					</button>
				</Form>
			</li>
			<li>
				<Form action="/app/forms/{form.id}/inbox?/bulkDelete" data={{ responses: selected }}>
					<button type="submit">
						<span>{$_('button.delete')}</span>
					</button>
				</Form>
			</li>
		</ul>
	</DropdownMenu>
</div>
