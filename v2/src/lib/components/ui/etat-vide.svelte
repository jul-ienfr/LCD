<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    message,
    action,
  }: {
    message: string;
    action?: Snippet;
  } = $props();
</script>

<div class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
  <p>{message}</p>
  {#if action}
    <div class="mt-3">{@render action()}</div>
  {/if}
</div>
