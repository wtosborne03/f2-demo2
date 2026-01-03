<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { PlayerInputPayload } from "$lib/wsapi/game";
  import Icon from "@iconify/svelte";
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
  <div class="text-lg">Fill in the Blank</div>
  <div class="mb-2 p-4">{m_data.question}</div>
  <form class="flex flex-col justify-center items-center w-full">
    <input
      class="input w-full text-lg preset-outlined-primary-500"
      type="text"
      maxlength="50"
      bind:value={answer_text}
      on:submit={submit_prompt}
    />
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
