<script lang="ts">
  import { get } from "svelte/store";
  import type { QuestionData } from "../types/page_data";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

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
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-3"
>
  {#each m_data.answers as answer}
    <Button
      size="l"
      square
      style="width:100%; margin-bottom: 1rem; margin-top: 1rem;"
      onclick={() =>
        submit_answer(m_data.answers.findIndex((a) => a == answer))}
      >{answer}</Button
    >
  {/each}
</div>
