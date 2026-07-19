<script lang="ts">
  import { get } from "svelte/store";
  import type { QuestionData } from "../types/page_data";
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
  class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center gap-4"
>
  {#each m_data.answers as answer}
    <button
      type="button"
      class="btn btn-primary btn-lg w-full py-5 h-auto text-lg font-black leading-snug"
      onclick={() =>
        submit_answer(m_data.answers.findIndex((a) => a == answer))}
    >
      {answer}
    </button>
  {/each}
</div>
