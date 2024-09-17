<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: PromptData;
  m_data = get<PlayerState>(player_state).page_data;

  let answer_text = "";

  function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        answer: answer_text,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div>Fill in the Blank:</div>
  <div class="mb-2 p-4">{m_data.question}</div>
  <form class="flex flex-col justify-center items-center">
    <input
      class="input"
      type="text"
      maxlength="50"
      bind:value={answer_text}
      on:submit={submit_prompt}
    />
    <button class="btn variant-filled mt-12" on:click={submit_prompt}
      >Submit</button
    >
  </form>
</div>
