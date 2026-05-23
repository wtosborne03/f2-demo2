<script lang="ts">
  import Icon from "@iconify/svelte";
  import { Button } from "m3-svelte";

  let { onSubmit }: { onSubmit: () => void } = $props();
</script>

<div class="submit-wrapper">
  <Button variant="filled" size="m" onclick={onSubmit}>
    Submit
    <Icon
      class="text-6xl"
      icon="streamline-flex:mail-send-email-message-circle"
    />
  </Button>
</div>

<style>
  .submit-wrapper {
    margin-top: 2rem;
  }
</style>
