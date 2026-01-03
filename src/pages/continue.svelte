<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  function confirm() {
    gameClient.sendPlayerInput("restartGame");
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <h3>Game Finished!</h3>
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn preset-filled m-2 p-2"
    on:click={confirm}>Restart Game ▶️</button
  >
</div>
