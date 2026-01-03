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

<div class="container w-full block flex-col p-2">
  <div class="flex flex-col justify-center items-center">
    <div class="mb-2 p-4">Choose the best answer:</div>
    {#each m_data.options as answer}
      <button
        style="width: 100%; font-size: 1.5rem; white-space: normal; word-wrap: break-word;"
        class="rounded-xl preset-filled m-2 p-2"
        on:click={() =>
          submit_answer(m_data.options.findIndex((a) => a == answer))}
      >
        {answer}
      </button>
    {/each}
  </div>
</div>
