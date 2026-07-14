<script lang="ts">
  import { type Snippet } from "svelte";

  interface Props {
    open: boolean;
    collapse?: "full" | "normal" | "no";
    modal?: boolean;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    collapse = "normal",
    modal = false,
    children,
  }: Props = $props();
</script>

<div
  class="fixed top-0 bottom-0 left-0 w-72 bg-base-200 border-r border-base-300 z-50 flex flex-col justify-stretch items-stretch px-0 py-4 transition-transform duration-300"
  class:-translate-x-full={!open}
  class:translate-x-0={open}
  class:shadow-2xl={open}
>
  {@render children?.()}
</div>

{#if modal && open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
  <div
    class="fixed inset-0 bg-black/50 z-40 transition-opacity"
    onclick={() => {
      open = false;
    }}
    role="button"
    tabindex="0"
    aria-label="Close sidebar"
  ></div>
{/if}
