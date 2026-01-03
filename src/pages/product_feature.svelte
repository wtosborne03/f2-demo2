<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { ProductPromptData } from "../types/page_data";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";

  let m_data: ProductPromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("product", {
      part: "feature",
      data: answer_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="mb-2 p-4 text-center">
    Come up with a feature for your product
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
