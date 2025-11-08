<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ProductPromptData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: ProductPromptData;
  m_data = get<PlayerState>(player_state).page_data;

  let answer_text = "";

  function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "product",
        part: "description",
        data: answer_text,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="mb-2 p-4 text-center">
    Come up with a description for your product
  </div>
  <form class="flex flex-col justify-center items-center w-full">
    <input
      class="input w-full"
      type="text"
      maxlength="50"
      bind:value={answer_text}
      on:submit={submit_prompt}
    />
    <button class="btn preset-filled mt-12" on:click={submit_prompt}
      >Submit</button
    >
  </form>
</div>
