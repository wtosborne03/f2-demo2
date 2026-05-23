<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <div
    class="card p-6 mt-8 max-w-md mx-auto bg-surface-container border border-outline-variant shadow-2xl flex flex-col gap-4 items-center text-center rounded-2xl"
  >
    <div>
      <h3 class="h3 font-bold text-primary underline">Admin</h3>
      <p class="text-surface-100 mt-2 text-xl">
        Verify that all players have completed the prompt.
      </p>
    </div>
    <div class="btn-wrapper">
      <Button
        variant="filled"
        onclick={confirm}
      >
        They drank 👍
      </Button>
    </div>
  </div>
</div>

<style>
  .btn-wrapper {
    width: 100%;
  }
  .btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.25rem 0;
    font-size: 1.25rem;
    font-weight: bold;
    background-color: #2e7d32; /* green standard color for confirm/success */
    color: white;
  }
</style>
