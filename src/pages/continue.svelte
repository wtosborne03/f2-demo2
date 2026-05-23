<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  function confirm() {
    gameClient.sendPlayerInput("restartGame");
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <h3 class="title-text">Game Finished!</h3>
  <div class="btn-wrapper">
    <Button variant="filled" size="xl" onclick={confirm}>
      Restart Game ▶️
    </Button>
  </div>
</div>

<style>
  .title-text {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    line-height: 1.333;
    font-weight: 400;
    color: var(--m3c-on-background);
    margin-bottom: 2rem;
  }

  .btn-wrapper {
    width: 100%;
    max-width: 20rem;
  }

  .btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.25rem 0;
    font-size: 1.25rem;
    font-weight: bold;
  }
</style>
