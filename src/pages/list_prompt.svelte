<script lang="ts">
  import { get } from "svelte/store";
  import type { ListPromptData } from "../types/page_data";
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
  class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6"
>
  <div class="aura mb-6">
    <div
      class="p-4 bg-secondary rounded-3xl flex flex-col items-center justify-center"
    >
      <h3 class="font-bold text-secondary-content text-base leading-snug">
        If your scenario is survivable, you lose the round.
      </h3>
    </div>
  </div>

  <form
    class="flex flex-col items-center w-full"
    onsubmit={(e) => {
      e.preventDefault();
      submit_prompt();
    }}
  >
    <label class="form-control w-full mb-6">
      <div class="label py-1">
        <span class="label-text font-bold text-md text-base-content/85"
          >Survival Scenario</span
        >
      </div>
      <textarea
        class="textarea textarea-bordered textarea-lg w-full font-semibold h-32"
        maxlength={110}
        bind:value={survival_prompt}
        placeholder="Stuck in a pit of sharks..."
      ></textarea>
    </label>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
