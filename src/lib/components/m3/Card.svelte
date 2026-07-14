<script lang="ts">
  import { type Snippet } from "svelte";

  interface Props {
    variant?: "filled" | "outlined" | "elevated";
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
    [key: string]: any;
  }

  let {
    variant = "filled",
    onclick,
    children,
    ...rest
  }: Props = $props();

  const variantClass = $derived(
    variant === "outlined" ? "border border-base-300 shadow-none bg-transparent" :
    variant === "elevated" ? "shadow-lg bg-base-100" :
    "bg-base-200 shadow-sm"
  );
</script>

{#if onclick}
  <button
    type="button"
    class="card {variantClass} text-left cursor-pointer transition-transform active:scale-[0.98] duration-150 p-4"
    {onclick}
    {...rest}
  >
    {@render children?.()}
  </button>
{:else}
  <div class="card {variantClass} p-4" {...rest}>
    {@render children?.()}
  </div>
{/if}
