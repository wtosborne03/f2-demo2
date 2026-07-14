<script lang="ts">
  import { type Snippet } from "svelte";

  interface Props {
    headline: string;
    supporting?: string;
    leading?: Snippet;
    trailing?: Snippet;
    lines?: "1" | "2" | "3";
    [key: string]: any;
  }

  let {
    headline,
    supporting,
    leading,
    trailing,
    lines = "1",
    ...rest
  }: Props = $props();
</script>

<div class="flex items-center gap-4 py-3 px-4 rounded-lg bg-base-100 border border-base-200/50 hover:bg-base-200/50 transition-colors" {...rest}>
  {#if leading}
    <div class="flex-shrink-0">
      {@render leading()}
    </div>
  {/if}
  <div class="flex-grow min-w-0">
    <div class="font-semibold text-sm truncate">{headline}</div>
    {#if supporting}
      <div class="text-xs text-base-content/70 mt-0.5">{supporting}</div>
    {/if}
  </div>
  {#if trailing}
    <div class="flex-shrink-0">
      {@render trailing()}
    </div>
  {/if}
</div>
