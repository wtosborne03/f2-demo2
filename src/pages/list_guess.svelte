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
  <form
    class="flex flex-col items-center w-full"
    onsubmit={(e) => {
      e.preventDefault();
      submit_prompt();
    }}
  >
    <label class="form-control w-full mb-6">
      <div class="label py-1">
        <span
          class="label-text font-bold text-md text-center text-base-content/85"
          >Think of a way out</span
        >
      </div>
      <textarea
        class="textarea textarea-bordered textarea-lg w-full font-semibold h-32"
        maxlength={110}
        bind:value={survival_prompt}
        placeholder="Type your scenario..."
      ></textarea>
    </label>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
