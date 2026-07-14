<script lang="ts">
  import { get } from "svelte/store";
  import type { SpyVoteData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: SpyVoteData;
  m_data = get(gameState).page_data;

  function submit_answer(index: number) {
    gameClient.sendInput({
      type: "playerVoteData",
      answer: m_data.options[index],
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center space-y-6">
  <div class="text-2xl font-black mb-2">Who do you think is the SPY?</div>
  
  <div class="w-full flex flex-col gap-4">
    {#each m_data.options as answer, index}
      <button
        type="button"
        class="btn btn-outline btn-lg w-full flex justify-between items-center text-left py-4 h-auto font-bold"
        style="border-color: {m_data.player_color[index]}; border-width: 2px;"
        onclick={() => submit_answer(m_data.options.findIndex((a) => a == answer))}
      >
        <span class="text-lg opacity-80">{m_data.option_by[index]}</span>
        <span class="text-base text-right leading-snug max-w-[60%] truncate">{answer}</span>
      </button>
    {/each}
  </div>
</div>
