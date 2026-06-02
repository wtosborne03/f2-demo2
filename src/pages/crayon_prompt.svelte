<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined } from "m3-svelte";

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4 py-8"
>
  <div class="header-icon text-5xl mb-4">🎨</div>
  <div class="subtitle-text">Prompt & Circumstance</div>
  <div class="instruction-text">Write a funny prompt for the AI to draw!</div>
  <form class="flex flex-col justify-center items-center w-full max-w-md gap-6" on:submit|preventDefault={submit_prompt}>
    <div class="field-wrapper w-full">
      <TextFieldOutlined
        label="Image Prompt"
        type="text"
        maxlength={128}
        placeholder="e.g., A cat riding a skateboard in space"
        bind:value={answer_text}
      />
      <div class="text-right text-xs text-stone-400 mt-1">
        {answer_text.length} / 128
      </div>
    </div>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 500;
    color: var(--m3c-primary);
    text-transform: uppercase;
    letter-spacing: 0.1rem;
    margin-bottom: 0.25rem;
  }

  .instruction-text {
    font-family: var(--m3-font); font-size: 1.5rem; line-height: 1.333; font-weight: 600;
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
