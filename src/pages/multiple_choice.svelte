<script lang="ts">
  import { get } from "svelte/store";
  import type { QuestionData } from "../types/page_data";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: QuestionData;
  m_data = get(gameState).page_data;

  function submit_answer(index: number) {
    gameClient.sendInput({
      type: "multiple_choice",
      answer_index: index,
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
