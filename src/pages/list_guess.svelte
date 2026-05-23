<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ListPromptData, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined, TextFieldOutlinedMultiline } from "m3-svelte";

  let guess = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("playerVoteData", {
      answer: guess,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <div class="subtitle-text">Think of a way out 🤔</div>
  <form
    class="flex flex-col justify-center items-center w-full max-w-md"
    on:submit|preventDefault={submit_prompt}
  >
    <div class="field-wrapper">
      <TextFieldOutlinedMultiline
        label="Survival Attempt"
        maxlength={78}
        bind:value={guess}
      />
    </div>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    line-height: 1.333;
    font-weight: 400;
    text-align: center;
    color: var(--m3c-on-background);
    margin-bottom: 2rem;
  }

  .field-wrapper {
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .field-wrapper :global(.m3-container) {
    width: 100%;
  }
</style>
