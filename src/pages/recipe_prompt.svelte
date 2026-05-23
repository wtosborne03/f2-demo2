<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { PlayerInputPayload } from "$lib/wsapi/game";
  import Icon from "@iconify/svelte";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined } from "m3-svelte";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendInput({
      type: "ideaSubmit",
      value: answer_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <div class="subtitle-text">What should we make?</div>
  <form class="flex flex-col justify-center items-center w-full max-w-md" on:submit|preventDefault={submit_prompt}>
    <div class="field-wrapper">
      <TextFieldOutlined
        label="Your Idea"
        type="text"
        maxlength={30}
        bind:value={answer_text}
      />
    </div>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font); font-size: 1.5rem; line-height: 1.333; font-weight: 400;
    text-align: center;
    color: var(--m3c-on-background);
    margin-bottom: 2rem;
  }

  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }
</style>
