<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ListPromptData, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let guess = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("playerVoteData", {
      answer: guess,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="text-lg text-center">Think of a way out 🤔</div>
  <form class="flex flex-col justify-center items-center w-full">
    <div class="flex flex-row justify-start items-center w-full">
      <textarea
        class="textarea text-lg rounded-3xl p-5 mt-10 w-full"
        maxlength="78"
        rows="4"
        placeholder="Survival Attempt"
        bind:value={guess}
      ></textarea>
    </div>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
