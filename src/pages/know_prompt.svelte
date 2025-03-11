<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { KnowData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: KnowData;
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
  <div class="mb-2 p-4 text-center">{m_data.prompt}</div>
  <form class="flex flex-col justify-center items-center">
    <input
      class="input w-full"
      type="text"
      maxlength="28"
      bind:value={answer_text}
      on:submit={submit_prompt}
    />
    <button class="btn variant-filled mt-12" on:click={submit_prompt}
      >Answer</button
    >
  </form>
</div>
