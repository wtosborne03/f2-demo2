<script lang="ts">
  import { get } from "svelte/store";
  import type { VoteData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: VoteData;
  m_data = get(gameState).page_data;

  function submit_answer(index: number) {
    gameClient.sendPlayerInput("playerVoteData", {
      answer: m_data.options[index],
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="text-2xl font-black mb-6">Choose the best answer:</div>
  
  <div class="w-full flex flex-col gap-4">
    {#each m_data.options as answer}
      <button
        type="button"
        class="btn btn-outline btn-primary btn-lg w-full py-5 h-auto text-lg font-black leading-snug"
        onclick={() => submit_answer(m_data.options.findIndex((a) => a == answer))}
      >
        {answer}
      </button>
    {/each}
  </div>
</div>
