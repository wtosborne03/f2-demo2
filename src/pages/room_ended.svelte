<script lang="ts">
  import { Button } from "m3-svelte";
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center gap-4 px-4">
  <div class="end-text">The Game was Ended. 🕹️</div>
  <div class="btn-wrapper">
    <Button variant="filled" onclick={() => window.location.reload()}>
      Restart
    </Button>
  </div>
</div>

<style>
  .end-text {
    font-family: var(--m3-font); font-size: 1.5rem; line-height: 1.333; font-weight: 400;
    color: var(--m3c-on-background);
  }

  .btn-wrapper {
    max-width: 12rem;
    width: 100%;
  }

  .btn-wrapper > :global(*) {
    width: 100%;
  }
</style>
