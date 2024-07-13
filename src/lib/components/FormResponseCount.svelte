<script lang="ts">
	export let count: {
		count: number;
		id: string;
		read: boolean | null;
		spam: boolean | null;
	}[];
	export let formId: string;
	export let received: number;

	$: entries = count.filter(({ id }) => id === formId);
	$: unreadSpam = entries
		.filter(({ read, spam }) => !!spam && !read)
		.reduce((acc, { count }) => acc + count, 0);
	$: unread = entries.filter(({ read }) => !read).reduce((acc, { count }) => acc + count, 0);
	$: totalUnread = Math.max(0, unread - unreadSpam);
</script>

<div class="inline-flex items-center gap-2">
	<a
		href="/app/forms/{formId}/inbox"
		class="badge"
		class:badge-primary={totalUnread}
		class:badge-ghost={totalUnread === 0}>{totalUnread}</a
	>
	<span class="opacity-20">/</span>
	<span class="opacity-60 text-sm">{received}</span>
</div>
