<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { VoteData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: VoteData;
  m_data = get<PlayerState>(player_state).page_data;

  function submit_answer(index: number) {
    sendMessage({
      type: "game",
      data: {
        type: "vote",
        answer: m_data.options[index],
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center p-4"
>
  <div class="mb-2 p-4">Choose the best answer:</div>
  {#each m_data.options as answer}
    <button
      style="width: 100%; font-size: 1.5rem; white-space: normal; word-wrap: break-word;"
      class="btn variant-filled m-2 p-2"
      on:click={() =>
        submit_answer(m_data.options.findIndex((a) => a == answer))}
    >
      {answer}
    </button>
  {/each}
</div>
