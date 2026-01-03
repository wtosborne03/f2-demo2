<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ListPromptData, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: ListPromptData;
  m_data = get(gameState).page_data;

  let survival_prompt = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("promptTextData", {
      answer: survival_prompt,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <aside class="alert preset-filled-warning-500 mb-4 text-2xl rounded-xl p-3">
    <!-- Icon -->
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3 text-lg text-center">
        If your scenario is survivable, you lose the round.
      </h3>
    </div>
    <!-- Actions -->
  </aside>
  <form class="flex flex-col justify-center items-center w-full">
    <div class="flex flex-row justify-start items-center w-full">
      <textarea
        class="textarea text-lg rounded-3xl p-5 mt-10 w-full"
        placeholder="Survival Scenario"
        rows="4"
        maxlength="110"
        bind:value={survival_prompt}
      ></textarea>
    </div>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
