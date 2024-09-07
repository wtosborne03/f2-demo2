<script lang="ts">
  import { sendMessage } from "$lib";
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
  <div class="text-lg">Try to guess the title of the list 🤔</div>
  <div class="flex flex-row justify-start items-center w-full">
    <input
      class="input mt-10 w-full"
      type="text"
      maxlength="28"
      placeholder="List Title"
      bind:value={guess}
    />
  </div>
  <button class="btn variant-filled mt-12" on:click={submit_prompt}
    >Submit</button
  >
</div>
