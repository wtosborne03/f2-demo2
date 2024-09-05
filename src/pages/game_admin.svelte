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

  let music = true;

  $: s_data, sendMessage({ type: "settings", data: s_data.settings });

  function startGame(event: Event) {
    event.stopPropagation();
    sendMessage({ type: "start_game" });
  }
</script>

<div
  class="container h-full mx-auto flex flex-col justify-center items-center"
  on:click={playerEmote}
>
  Joined Game.
  <button class="btn variant-filled" on:click={startGame}> Start Game</button>
  <h3 class="mt-12">Settings</h3>
  <div class="p-4 border-2 border-white rounded-xl">
    <div class="flex flex-row justify-between items-center">
      <div class="mr-4">Drinking Game:</div>
      <SlideToggle name="slide" bind:checked={s_data.settings.drinking} />
    </div>
    <div class="flex flex-row justify-between items-center mt-4">
      <div class="mr-4">Music:</div>
      <SlideToggle name="slide" bind:checked={music} />
    </div>
  </div>
</div>
