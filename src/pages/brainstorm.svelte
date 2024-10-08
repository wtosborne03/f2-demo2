<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";
  import Spinner from "../components/spinner.svelte";

  let answer_text = "";
  let loading = false;

  async function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        answer: answer_text,
      },
    });

    loading = true;
    answer_text = "";
    await new Promise((r) => setTimeout(r, 1000));
    loading = false;
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="mb-2 p-4">
    Think of some divisive debate topics. Submit as many as you want!
  </div>
  <form class="flex flex-col justify-center items-center">
    <input
      class="input w-full"
      type="text"
      maxlength="50"
      bind:value={answer_text}
      on:submit={submit_prompt}
    />
    <button
      class="btn variant-filled mt-12"
      on:click={submit_prompt}
      disabled={loading}
      >{#if loading}<Spinner />{:else}Submit{/if}</button
    >
  </form>
</div>
