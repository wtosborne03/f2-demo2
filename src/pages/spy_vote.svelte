<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { SpyVoteData, VoteData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  let m_data: SpyVoteData;
  m_data = get(gameState).page_data;

  function submit_answer(index: number) {
    gameClient.sendInput({
      type: "playerVoteData",
      answer: m_data.options[index],
    });
  }
</script>

<div class="container w-full block flex-col p-2">
  <div class="flex flex-col justify-center items-center">
    <div class="mb-2 p-4 text-center">Who do you think is the SPY?</div>
    {#each m_data.options as answer, index}
      <Button
        size="l"
        style="width:100%; margin-bottom: 1rem; margin-top: 1rem;"
        onclick={() =>
          submit_answer(m_data.options.findIndex((a) => a == answer))}
      >
        <div class=" text-xl mr-auto">{m_data.option_by[index]}</div>
        {answer}
      </Button>
    {/each}
  </div>
</div>
