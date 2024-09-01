<script lang="ts">
  import { playerEmote } from "$lib/player_emote";
</script>

<div
  class="container h-full mx-auto flex justify-center items-center"
  on:click={playerEmote}
>
  Joined Game
</div>
