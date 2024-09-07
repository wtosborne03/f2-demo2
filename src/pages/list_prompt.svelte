<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ListPromptData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: ListPromptData;
  m_data = get<PlayerState>(player_state).page_data;

  let list_answers = new Array(5).fill("");

  function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        answer: list_answers,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <aside class="alert variant-filled-warning mb-10 text-2xl">
    <!-- Icon -->
    <div>⚠️</div>
    <!-- Message -->
    <div class="alert-message">
      <h3 class="h3 text-3xl">Your List Matters</h3>
      <p>If no players can guess your list, you will lose this turn.</p>
    </div>
    <!-- Actions -->
  </aside>
  <div>List title:</div>
  <div class="text-xl text-center">{m_data.list_prompt}</div>
  {#each { length: 5 } as _, i}
    <div class="flex flex-row justify-start items-center">
      <span class="text-lg">{i + 1}: </span>
      <input
        class="input mt-2"
        type="text"
        maxlength="20"
        bind:value={list_answers[i]}
      />
    </div>
  {/each}
  <button class="btn variant-filled mt-12" on:click={submit_prompt}
    >Submit</button
  >
</div>
