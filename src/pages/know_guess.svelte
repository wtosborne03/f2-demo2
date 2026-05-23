<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { KnowData, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";
  import { TextField, Button } from "m3-svelte";

  let m_data: KnowData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("promptData", {
      question: answer_text,
    });
  }
</script>

<div
  class="container h-full overflow-y-auto md:max-w-140 mx-auto w-full flex flex-col justify-start items-center"
>
  <form class="flex h-full flex-col justify-center items-center w-full" on:submit|preventDefault={submit_prompt}>
    <div
      class="mb-12 px-10 py-3 text-lg text-white/85 text-center bg-surface-container rounded-2xl border border-outline-variant"
    >
      "{m_data.prompt}"
    </div>
    <div class="input-row">
      <div class="text-field-wrapper">
        <TextField
          label="Your Guess"
          type="text"
          maxlength={28}
          bind:value={answer_text}
        />
      </div>
      <Button
        variant="filled"
        onclick={submit_prompt}
        iconType="full"
      >
        <Icon icon="mingcute:send-fill" style="font-size: 1.5rem;" />
      </Button>
    </div>
  </form>
</div>

<style>
  .input-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: stretch;
    align-items: center;
    gap: 0.5rem;
  }

  .text-field-wrapper {
    flex-grow: 1;
  }

  .text-field-wrapper > :global(*) {
    width: 100%;
  }
</style>
