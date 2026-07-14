<script lang="ts">
  interface Props {
    size?: number;
    [key: string]: any;
  }

  let {
    size = 48,
    ...rest
  }: Props = $props();
</script>

<span
  class="loading loading-spinner text-primary"
  style="width: {size}px; height: {size}px;"
  {...rest}
></span>
