<script lang="ts">
  import Icon from "@iconify/svelte";
  import { Button } from "m3-svelte";

  let { onSubmit }: { onSubmit: () => void } = $props();
</script>

<Button variant="filled" size="l" onclick={onSubmit}>
  Submit
  <Icon class="text-4xl" icon="iconamoon:send-bold" />
</Button>
