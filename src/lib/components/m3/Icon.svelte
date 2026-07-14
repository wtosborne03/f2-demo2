<script lang="ts">
  interface IconObj {
    width?: number;
    height?: number;
    body: string;
  }

  interface Props {
    icon: IconObj;
    size?: number;
    [key: string]: any;
  }

  let {
    icon,
    size = 24,
    ...rest
  }: Props = $props();

  const width = $derived(icon?.width ?? 24);
  const height = $derived(icon?.height ?? 24);
</script>

{#if icon}
  <svg
    viewBox="0 0 {width} {height}"
    width={size}
    height={size}
    class="inline-block fill-current stroke-none"
    {...rest}
  >
    {@html icon.body}
  </svg>
{/if}
