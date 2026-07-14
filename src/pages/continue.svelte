<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
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

<div class="flex flex-col justify-start items-center h-full w-full max-w-md mx-auto px-6 py-8 overflow-y-auto space-y-8">
  <h3 class="text-3xl font-black text-center">Game Finished!</h3>
  
  {#if $gameState.admin}
    <div class="w-full flex justify-center">
      <button
        type="button"
        class="btn btn-primary btn-lg w-full max-w-xs font-bold text-lg"
        onclick={confirm}
      >
        Restart Game ▶️
      </button>
    </div>
  {:else}
    <p class="text-base text-base-content/80 text-center font-semibold">
      Waiting for host to restart the game...
    </p>
  {/if}

  {#if userId}
    <div class="w-full flex flex-col items-center">
      <h4 class="text-md font-bold uppercase tracking-wider text-base-content/70 mb-4 text-center">
        Your Creations This Game
      </h4>
      <div class="w-full">
        <UserImageGrid {userId} {gameId} />
      </div>
    </div>
  {/if}
</div>
