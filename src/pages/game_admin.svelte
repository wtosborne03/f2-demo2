<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { playerEmote } from "$lib/player_emote";

  function startGame() {
    sendMessage({ type: "start_game" });
  }
</script>

<div
  class="container h-full mx-auto flex flex-col justify-center items-center"
  on:click={playerEmote}
>
  Joined Game.
  <button class="btn variant-filled" on:click={startGame}> Start Game</button>
</div>
