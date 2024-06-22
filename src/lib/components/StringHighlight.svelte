<script lang="ts">
  export let highlights: { start: number; length: number; }[] = [];
  export let value: string;

  $: tokens = highlights.map(({ length, start }, i) => {
    const prev = highlights[i - 1];
    const offset = prev ? (prev.start + prev.length) : 0;
    return (prev ? value.substring(offset, start) : value.substring(0, start))
      + '<mark>'
      + value.substring(start, start + length)
      + '</mark>'
      + (i === highlights.length - 1 ? value.substring(start + length) : '');
  });
</script>

{#if tokens.length}
{@html tokens.join('')}
{:else}
{value}
{/if}