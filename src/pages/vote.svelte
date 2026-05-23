<script lang="ts">
  import { get } from "svelte/store";
  import type { VoteData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

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
    <div class="mb-2 p-4 text-lg">Choose the best answer:</div>
    {#each m_data.options as answer}
      <Button
        size="l"
        square
        style="width:100%; margin-bottom: 0.5rem; margin-top: 0.5rem;"
        onclick={() =>
          submit_answer(m_data.options.findIndex((a) => a == answer))}
      >
        {answer}
      </Button>
    {/each}
  </div>
</div>
