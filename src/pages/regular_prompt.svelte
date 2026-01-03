<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="text-center opacity-80">Are you the spy? You can't know!</div>
  <div class="mb-2 p-4 text-center">{m_data.question}</div>
  <form class="flex flex-col justify-center items-center">
    <input
      class="input w-full"
      type="text"
      maxlength="28"
      bind:value={answer_text}
      on:submit={submit_prompt}
    />
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
