<script lang="ts">
  import { type Snippet } from "svelte";

  interface Props {
    variant?: "elevated" | "filled" | "tonal" | "outlined" | "text";
    size?: "xs" | "s" | "m" | "l" | "xl";
    onclick?: (e: MouseEvent) => void;
    disabled?: boolean;
    href?: string;
    iconType?: "none" | "left" | "full";
    square?: boolean;
    children?: Snippet;
    [key: string]: any;
  }

  let {
    variant = "filled",
    size = "s",
    onclick,
    disabled = false,
    href,
    iconType = "none",
    square = false,
    children,
    ...rest
  }: Props = $props();

  const variantClass = $derived(
    variant === "filled"
      ? "btn-primary"
      : variant === "tonal"
        ? "btn-secondary"
        : variant === "outlined"
          ? "btn-outline"
          : variant === "text"
            ? "btn-ghost"
            : "shadow-md bg-base-200",
  );

  const sizeClass = $derived(
    size === "xs"
      ? "btn-xs"
      : size === "s"
        ? "btn-sm"
        : size === "m"
          ? "btn-md"
          : size === "l"
            ? "btn-lg"
            : "btn-lg py-3 h-auto",
  );
</script>

{#if href}
  <a
    {href}
    class="btn {variantClass} {sizeClass}"
    class:btn-square={square || iconType === "full"}
    {onclick}
    {...rest}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    type="button"
    class="btn {variantClass} {sizeClass}"
    class:btn-square={square || iconType === "full"}
    {disabled}
    {onclick}
    {...rest}
  >
    {@render children?.()}
  </button>
{/if}
