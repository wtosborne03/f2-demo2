<script lang="ts">
  interface Props {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onchange?: (e: Event) => void;
    [key: string]: any;
  }

  let {
    value = $bindable(50),
    min = 0,
    max = 100,
    step = 1,
    onchange,
    ...rest
  }: Props = $props();
</script>

<input
  type="range"
  class="range range-primary range-sm w-full"
  bind:value={value}
  {min}
  {max}
  {step}
  onchange={onchange}
  {...rest}
/>
