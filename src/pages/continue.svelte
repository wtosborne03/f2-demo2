<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";
  import UserImageGrid from "$lib/components/UserImageGrid.svelte";
  import { authClient } from "../stores/authStore";

  const session = authClient.useSession();

  let userId = "";
  if (typeof window !== "undefined") {
    userId = $session.data?.user?.id || localStorage.getItem("temp_user_id") || "";
  }

  let gameId = $gameState.page_data?.gameId;

  function confirm() {
    gameClient.sendPlayerInput("restartGame");
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-start items-center px-4 py-8 overflow-y-auto"
>
  <h3 class="title-text">Game Finished!</h3>
  
  {#if $gameState.admin}
    <div class="btn-wrapper mb-8">
      <Button variant="filled" size="xl" onclick={confirm}>
        Restart Game ▶️
      </Button>
    </div>
  {:else}
    <p class="waiting-text mb-8">Waiting for host to restart the game...</p>
  {/if}

  {#if userId}
    <div class="gallery-section w-full">
      <h4 class="gallery-title">Your Creations This Game</h4>
      <UserImageGrid {userId} {gameId} />
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 32rem;
  }

  .title-text {
    font-family: var(--m3-font);
    font-size: 2rem;
    line-height: 1.333;
    font-weight: 800;
    color: var(--m3c-on-background);
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .waiting-text {
    font-family: var(--m3-font);
    font-size: 1.1rem;
    color: var(--m3c-on-surface-variant);
    text-align: center;
    font-weight: 500;
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

  .gallery-section {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .gallery-title {
    font-family: var(--m3-font);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--m3c-on-background);
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
  }
</style>
