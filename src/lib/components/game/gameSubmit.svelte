<script lang="ts">
  import Icon from "@iconify/svelte";
  import { Button } from "m3-svelte";

  let {
    onSubmit,
    label = "Submit",
    icon = "iconamoon:send-bold",
  }: { onSubmit: () => void; label?: string; icon?: string } = $props();
</script>

<Button variant="filled" size="l" onclick={onSubmit}>
  {label}
  <Icon class="text-4xl" {icon} />
</Button>
