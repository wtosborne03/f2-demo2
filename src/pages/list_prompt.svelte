<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ListPromptData, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined, TextFieldOutlinedMultiline } from "m3-svelte";

  let m_data: ListPromptData;
  m_data = get(gameState).page_data;

  let survival_prompt = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("promptTextData", {
      answer: survival_prompt,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <div class="alert-banner">
    <h3>If your scenario is survivable, you lose the round.</h3>
  </div>

  <form
    class="flex flex-col justify-center items-center w-full max-w-md"
    on:submit|preventDefault={submit_prompt}
  >
    <div class="field-wrapper">
      <TextFieldOutlinedMultiline
        label="Survival Scenario"
        maxlength={110}
        bind:value={survival_prompt}
      />
    </div>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>

<style>
  .alert-banner {
    background-color: var(--m3c-error-container);
    color: var(--m3c-on-error-container);
    padding: 1rem;
    border-radius: var(--m3-shape-medium);
    text-align: center;
    width: 100%;
    max-width: 28rem;
    border: 1px solid var(--m3c-error);
    margin-bottom: 2rem;
  }

  .alert-banner h3 {
    margin: 0;
    font-family: var(--m3-font);
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 400;
    font-weight: 500;
  }

  .field-wrapper {
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .field-wrapper :global(.m3-container) {
    width: 100%;
  }
</style>
