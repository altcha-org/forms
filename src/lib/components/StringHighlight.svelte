<script lang="ts">
	import DOMPurify from 'isomorphic-dompurify';

	export let highlights: { start: number; length: number }[] = [];
	export let value: string;

	$: tokens = highlights
		.map(({ length, start }, i) => {
			const prev = highlights[i - 1];
			const offset = prev ? prev.start + prev.length : 0;
			return (
				(prev ? value.substring(offset, start) : trimStart(value.substring(0, start))) +
				'<mark>' +
				value.substring(start, start + length) +
				'</mark>' +
				(i === highlights.length - 1 ? value.substring(start + length) : '')
			);
		})
		.join('')
		.split('\n')
		.filter((line) => line.includes('<mark>'));

	function trimStart(str: string, maxLen: number = 80) {
		if (str.length < maxLen) {
			return str;
		}
		return '…' + str.slice(str.indexOf(' ', str.length - maxLen)).trimStart();
	}

	function sanitizeHTML(html: string) {
		return DOMPurify.sanitize(html);
	}
</script>

{#if tokens.length}
	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html sanitizeHTML(tokens.join('\n'))}
{:else}
	{value}
{/if}
