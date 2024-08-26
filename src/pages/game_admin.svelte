<script>
  import { sendMessage } from "$lib/index";

  function startGame() {
    sendMessage({ type: "start_game" });
  }
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
  Joined Game.
  <button class="btn variant-filled" on:click={startGame}> Start Game</button>
</div>
