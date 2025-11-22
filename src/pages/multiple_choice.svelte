<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { QuestionData } from "../types/page_data";
  import { player_state } from "../stores/player_state";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient } from "$lib/gameService";

  let m_data: QuestionData;
  m_data = get(player_state).pageData;

  function submit_answer(index: number) {
    gameClient.sendPlayerInput({
      payload: {
        $case: "multipleChoice",
        multipleChoice: {
          answer: m_data.answers[index],
        },
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  {#each m_data.answers as answer}
    <button
      style="width: 100%; font-size: 1.5rem; white-space: normal; word-wrap: break-word;"
      class="rounded-xl preset-filled m-2 p-2"
      on:click={() =>
        submit_answer(m_data.answers.findIndex((a) => a == answer))}
      >{answer}</button
    >
  {/each}
</div>
