<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { playerEmote } from "$lib/player_emote";
  import { SlideToggle } from "@skeletonlabs/skeleton";
  import type { adminStartData } from "../types/page_data";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";

  let s_data: adminStartData;
  s_data = get<PlayerState>(player_state).page_data;

  player_state.subscribe((value) => {
    s_data = value.page_data;
  });

  $: s_data, sendMessage({ type: "settings", data: s_data.settings });

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
  <SlideToggle name="slide" bind:checked={s_data.settings.drinking} />
</div>
