<script lang="ts">
  interface Props {
    checked: boolean;
    disabled?: boolean;
    onchange?: (e: Event) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    onchange
  }: Props = $props();
</script>

<input
  type="checkbox"
  class="toggle toggle-primary"
  bind:checked={checked}
  {disabled}
  onchange={onchange}
/>
