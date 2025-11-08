<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ListPromptData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let guess = "";

  function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "guess",
        answer: guess,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="text-lg text-center">Think of a way out 🤔</div>
  <form class="flex flex-col justify-center items-center w-full">
    <div class="flex flex-row justify-start items-center w-full">
      <textarea
        class="textarea mt-10 w-full"
        maxlength="78"
        rows="4"
        placeholder="Survival Attempt"
        bind:value={guess}
      />
    </div>
    <button class="btn preset-filled mt-12" on:click={submit_prompt}
      >Submit</button
    >
  </form>
</div>
